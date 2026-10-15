import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { registerDevice } from '@/api/endpoints';

const PUSH_TOKEN_KEY = 'expo_push_token';

// The server's pushes (SendExpoPush) don't name a channel, so Expo delivers
// them on 'default' — created here, and set as defaultChannel in app.json.
const CHANNEL_ID = 'default';

// What the server puts in every push's `data` (see docs/api/employee-mobile-api.md).
export type PushData = {
  type?: 'status_change' | 'on_hold' | 'new_message';
  ticket_id?: string;
  ticket_number?: string;
};

// Show pushes as a banner even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Asks for permission, gets this phone's Expo push token and registers it
// with the server. Returns null (silently) when push isn't possible: an
// emulator, permission denied, Expo Go on Android, or no EAS project yet.
export async function registerForPush(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null;

    if (Platform.OS === 'android') {
      // Must exist before requesting a token on Android 13+.
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Request updates',
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: '#2d5a2d',
      });
    }

    const current = await Notifications.getPermissionsAsync();
    const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return null;

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) return null;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await registerDevice(token, Platform.OS === 'ios' ? 'ios' : 'android');
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
    return token;
  } catch (error) {
    console.warn('Push registration skipped:', error);
    return null;
  }
}

// The token sent on logout so the server stops pushing to this phone.
export async function takeStoredPushToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  return token;
}
