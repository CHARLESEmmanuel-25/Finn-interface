import { useEffect } from "react";
import { Stack, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const [isLoggedIn, userId] = await AsyncStorage.multiGet(["isLoggedIn", "userId"]);
    const loggedIn = isLoggedIn[1] === "true";
    const hasUserId = !!userId[1];

    if (loggedIn && !hasUserId) {
      await AsyncStorage.multiRemove(["isLoggedIn", "userData", "userId"]);
      router.replace("/login");
    }
  };

  return <Stack screenOptions={{ headerShown: false }} />;
}
