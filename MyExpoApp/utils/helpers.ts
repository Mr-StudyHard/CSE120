import { Alert } from "react-native";
import * as Clipboard from "expo-clipboard";

export const getTypeColor = (color: string) => {
  switch (color) {
    case "button-border-color":
      return "bg-button-outline";
    case "green":
      return "bg-green-500";
    case "orange":
      return "bg-orange-500";
    case "red":
      return "bg-red-500";
    case "blue":
      return "bg-blue-500";
    default:
      return "bg-black";
  }
};

export const copyToClipboard = async (
  value: string,
  setCopyPressed?: (pressed: boolean) => void,
) => {
  if (!value) {
    return;
  }

  setCopyPressed?.(true);

  try {
    await Clipboard.setStringAsync(value);
    Alert.alert("Success", "Link copied to clipboard!");
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    Alert.alert("Error", "Failed to copy link to clipboard");
  } finally {
    setTimeout(() => setCopyPressed?.(false), 200);
  }
};
