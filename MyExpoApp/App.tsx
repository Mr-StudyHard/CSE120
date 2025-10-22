import React, { useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";

import { Header } from "./components/Header";
import { FileList } from "./components/FileList";
import { BottomNavigation } from "./components/BottomNavigation";
import { NoteModal } from "./components/NoteModal";
import { FileDetailModal } from "./components/FileDetailModal";
import { BundleModal } from "./components/BundleModal";
import { files as defaultFiles, FileItem } from "./data/files";
import { getTypeColor, copyToClipboard } from "./utils/helpers";

import "./global.css";

export default function App() {
  const [screen, setScreen] = useState<
    "landing" | "login" | "signup" | "home" | "settings"
  >("landing");

  // Track whether the user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Landing screen similar to the provided mockup
  const LandingScreen = () => {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
        <StatusBar style="light" />
        <View className="w-full max-w-md">
          <Text className="text-2xl text-button-outline font-extrabold mb-4 text-center">
            ConnectWork
          </Text>

          <Text className="text-gray-300 text-sm mb-10">
            Create your personalized layout of information from conferences and
            expo events that has links, business cards, photos, and detailed
            description of your links such as date, location, and type.
          </Text>

          <TouchableOpacity
            onPress={() => setScreen("login")}
            className="border-2 border-button-outline rounded-md py-3 mb-4 items-center"
          >
            <Text className="text-button-outline font-semibold">Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setScreen("signup")}
            className="border-2 border-button-outline rounded-md py-3 items-center"
          >
            <Text className="text-button-outline font-semibold">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  // Login screen with username/password validation
  const LoginScreen = () => {
  // Pre-fill username and password with 'Admin' as requested
  const [username, setUsername] = useState("Admin");
  const [password, setPassword] = useState("Admin");

    const onSubmit = () => {
      // Validate username 'Admin' and password 'Admin' (case-sensitive)
      if (username === "Admin" && password === "Admin") {
        // Ensure navigation happens on web (Alert callbacks may not fire there)
        setIsLoggedIn(true);
        setScreen("home");
        Alert.alert("Success", "Logged in successfully");
      } else {
        Alert.alert("Error", "Invalid username or password");
      }
    };

    return (
      <SafeAreaView className="flex-1 bg-background px-6 items-center">
        <StatusBar style="light" />
        <View className="w-full max-w-md mt-24">
          <Text className="text-2xl text-button-outline font-extrabold mb-6 text-center">
            Log In
          </Text>

          <Text className="text-gray-300 mb-2">Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            className="bg-card-bg rounded px-4 py-3 text-white mb-4"
            placeholder="username"
            placeholderTextColor="#9CA3AF"
          />

          <Text className="text-gray-300 mb-2">Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="bg-card-bg rounded px-4 py-3 text-white mb-6"
            placeholder="password"
            placeholderTextColor="#9CA3AF"
          />

          <TouchableOpacity
            onPress={onSubmit}
            className="bg-button-outline rounded-md py-3 items-center mb-4"
          >
            <Text className="text-black font-semibold">Submit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setScreen("landing")}
            className="items-center"
          >
            <Text className="text-gray-400">Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  const SignUpScreen = () => {
    return (
      <SafeAreaView className="flex-1 bg-background px-6 items-center">
        <StatusBar style="light" />
        <View className="w-full max-w-md mt-24 items-center">
          <Text className="text-2xl text-button-outline font-extrabold mb-6">
            Sign Up
          </Text>
          <Text className="text-gray-300 mb-4 text-center">
            This is a placeholder Sign Up screen. You can implement account
            creation here.
          </Text>
          <TouchableOpacity
            onPress={() => setScreen("landing")}
            className="border-2 border-button-outline rounded-md py-3 px-6 items-center"
          >
            <Text className="text-button-outline">Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  // The original main app content (renamed Home)
  const Home = () => {
    type BundleItem = {
      id: number;
      name: string;
      date: string;
      type: string;
      typeColor: string;
      number: string;
      bundledUrls: string[];
      createdAt: string;
      creator: string;
      files: FileItem[];
      content: string;
    };

    const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
    const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
    const [noteTitle, setNoteTitle] = useState("");
    const [noteText, setNoteText] = useState("");
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [isFileDetailVisible, setIsFileDetailVisible] = useState(false);
    const [isCopyPressed, setIsCopyPressed] = useState(false);
    const [, setSelectedFilesForUpload] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
    const [bundles, setBundles] = useState<BundleItem[]>([]);
    const [notes, setNotes] = useState<FileItem[]>([]);
    const [selectedBundle, setSelectedBundle] = useState<BundleItem | null>(null);
    const [isBundleDetailVisible, setIsBundleDetailVisible] = useState(false);

    const combinedFiles = useMemo(() => {
      return [...notes, ...defaultFiles, ...bundles];
    }, [notes, bundles]);

    const formatDateTime = (date: Date) => {
      const month = `${date.getMonth() + 1}`.padStart(2, "0");
      const day = `${date.getDate()}`.padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours();
      const minutes = `${date.getMinutes()}`.padStart(2, "0");
      const period = hours >= 12 ? "PM" : "AM";
      const hourOnClock = hours % 12 === 0 ? 12 : hours % 12;

      return `${month}/${day}/${year} ${hourOnClock}:${minutes}${period}`;
    };

    const toggleFileSelection = (fileId: number) => {
      if (!defaultFiles.some((file) => file.id === fileId)) {
        return;
      }

      setSelectedFiles((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(fileId)) {
          newSet.delete(fileId);
        } else {
          newSet.add(fileId);
        }
        return newSet;
      });
    };

    const openFileDetail = (file: any) => {
      setSelectedFile(file);
      setIsFileDetailVisible(true);
    };

    const handleCopyPress = () => {
      if (selectedFile?.url) {
        copyToClipboard(selectedFile.url, setIsCopyPressed);
      }
    };

    const pickDocument = async () => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: "*/*",
          multiple: true,
          copyToCacheDirectory: true,
        });

        if (!result.canceled) {
          setSelectedFilesForUpload(result.assets ?? []);
          Alert.alert(
            "Files Selected",
            `${result.assets?.length ?? 0} file(s) selected for upload.\nUpload functionality will be added later.`,
          );
        }
      } catch (error) {
        console.error("Document picker error:", error);
        Alert.alert("Error", "Failed to select files");
      }
    };

    const handleNoteSave = () => {
      const trimmedTitle = noteTitle.trim();
      const trimmedText = noteText.trim();

      if (!trimmedTitle) {
        Alert.alert("Missing Title", "Please add a title before saving.");
        return;
      }

      const timestamp = new Date();
      const formattedDate = formatDateTime(timestamp);
      const referenceNumber = (
        defaultFiles.length + bundles.length + notes.length + 241
      ).toString();

      const newNote: FileItem = {
        id: timestamp.getTime(),
        name: trimmedTitle,
        date: formattedDate,
        type: "Note",
        typeColor: "green",
        number: referenceNumber,
        createdAt: formattedDate,
        creator: "dsanchez113@ucmerced.edu",
        url: "",
        content: trimmedText,
      };

      setNotes((prev) => [newNote, ...prev]);
      setIsNoteModalVisible(false);
      setNoteTitle("");
      setNoteText("");
    };

    const handleOpenNoteModal = () => {
      setNoteTitle("");
      setNoteText("");
      setIsNoteModalVisible(true);
    };

    const handleCloseNoteModal = () => {
      setIsNoteModalVisible(false);
      setNoteTitle("");
      setNoteText("");
    };

    const handleLinkPress = () => {
      if (selectedFiles.size === 0) {
        Alert.alert("No Files Selected", "Please select files to create a bundle.");
        return;
      }

  const selectedFilesData = defaultFiles.filter((file) => selectedFiles.has(file.id));
      const bundleUrls = selectedFilesData.map((file) => file.url);

      const newBundle: BundleItem = {
        id: Date.now(),
        name: `Bundle ${bundles.length + 1}`,
        bundledUrls: bundleUrls,
        createdAt: new Date().toISOString(),
        creator: "dsanchez113@ucmerced.edu",
  files: selectedFilesData,
        type: "Bundle",
        typeColor: "button-border-color",
        number: `${250 + bundles.length}`,
        date: new Date().toLocaleString(),
        content: `Bundle containing ${selectedFilesData.length} file(s)`,
      };

      setBundles((prev) => [...prev, newBundle]);
      setSelectedFiles(new Set());
      Alert.alert("Bundle Created", `Bundle created with ${selectedFilesData.length} file(s).`);
    };

    const openBundleDetail = (bundle: BundleItem) => {
      setSelectedBundle(bundle);
      setIsBundleDetailVisible(true);
    };

    const handleMicrophonePress = () => {
      console.log("Microphone button pressed");
    };

    const handleCameraPress = () => {
      console.log("Camera button pressed");
    };

    return (
      <SafeAreaView className="flex-1 bg-background">
        <StatusBar style="light" />

        <Header
          onLinkPress={handleLinkPress}
          getTypeColor={getTypeColor}
          onSettingsPress={() => setScreen("settings")}
        />

        <FileList
          files={combinedFiles}
          selectedFiles={selectedFiles}
          onFilePress={(file) => {
            if (file.type === "Bundle") {
              openBundleDetail(file as unknown as BundleItem);
            } else {
              openFileDetail(file);
            }
          }}
          onToggleFileSelection={toggleFileSelection}
          getTypeColor={getTypeColor}
        />

        <BottomNavigation
          onNotePress={handleOpenNoteModal}
          onAttachmentPress={pickDocument}
          onMicrophonePress={handleMicrophonePress}
          onCameraPress={handleCameraPress}
        />

        <NoteModal
          isVisible={isNoteModalVisible}
          noteTitle={noteTitle}
          noteText={noteText}
          onNoteTitleChange={setNoteTitle}
          onNoteTextChange={setNoteText}
          onClose={handleCloseNoteModal}
          onSave={handleNoteSave}
        />

        <FileDetailModal
          isVisible={isFileDetailVisible}
          selectedFile={selectedFile}
          isCopyPressed={isCopyPressed}
          onClose={() => setIsFileDetailVisible(false)}
          onCopyPress={handleCopyPress}
          getTypeColor={getTypeColor}
        />

        <BundleModal
          isVisible={isBundleDetailVisible}
          bundleData={selectedBundle}
          onClose={() => setIsBundleDetailVisible(false)}
          getTypeColor={getTypeColor}
        />
      </SafeAreaView>
    );
  };

  // Settings screen
  const Settings = () => {
    return (
      <SafeAreaView className="flex-1 bg-background px-6">
        <StatusBar style="light" />
        <View className="mt-16">
          <Text className="text-2xl text-button-outline font-extrabold mb-6">Settings</Text>

          <View className="mb-4">
            <Text className="text-gray-300 mb-2">Account</Text>
            {isLoggedIn ? (
              <TouchableOpacity
                onPress={() => {
                  // Log out the user
                  setIsLoggedIn(false);
                  setScreen("landing");
                }}
                className="border-2 border-button-outline rounded-md py-3 items-center"
              >
                <Text className="text-button-outline">Log Out</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setScreen("landing")}
                className="border-2 border-button-outline rounded-md py-3 items-center"
              >
                <Text className="text-button-outline">Open Log In / Sign Up</Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="mb-4">
            <Text className="text-gray-300 mb-2">Notifications</Text>
            <TouchableOpacity className="border-2 border-button-outline rounded-md py-3 items-center">
              <Text className="text-button-outline">Notification Options</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => setScreen("home")} className="mt-6 items-center">
            <Text className="text-gray-400">Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  // Render the correct screen wrapped with SafeAreaProvider for web
  return (
    <SafeAreaProvider>
      {screen === "landing" ? (
        <LandingScreen />
      ) : screen === "login" ? (
        <LoginScreen />
      ) : screen === "signup" ? (
        <SignUpScreen />
      ) : screen === "settings" ? (
        <Settings />
      ) : (
        <Home />
      )}
    </SafeAreaProvider>
  );
}
