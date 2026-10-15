import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useNewUpdatesCount, useUnread } from '@/api/queries';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const theme = useTheme();
  const unread = useUnread().data?.total ?? 0;
  const newUpdates = useNewUpdatesCount();

  return (
    <NativeTabs
      backgroundColor={theme.backgroundElement}
      indicatorColor={theme.backgroundSelected}
      labelStyle={{ selected: { color: theme.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>My Requests</NativeTabs.Trigger.Label>
        {/* Unread chat messages from IT across all of the employee's requests. */}
        {unread > 0 ? <NativeTabs.Trigger.Badge>{unread > 99 ? '99+' : String(unread)}</NativeTabs.Trigger.Badge> : null}
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabIcons/home.png')} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="updates">
        <NativeTabs.Trigger.Label>Updates</NativeTabs.Trigger.Label>
        {newUpdates > 0 ? <NativeTabs.Trigger.Badge>{newUpdates > 99 ? '99+' : String(newUpdates)}</NativeTabs.Trigger.Badge> : null}
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabIcons/bell.png')} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabIcons/person.png')} renderingMode="template" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
