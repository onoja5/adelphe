import { Stack } from 'expo-router';
import { Colors } from '../../src/constants/colors';

export default function MoodLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}
