import React, { useRef, useState } from "react";
import { View, Pressable, StyleSheet, Button, Text, Alert } from "react-native";
import { CameraView, useCameraPermissions, CameraMode, CameraType } from "expo-camera";

type Props = {
  onClose: () => void;
  onPhotoTaken?: (uri: string) => void;
};

const CameraViewWrapper: React.FC<Props> = ({ onClose, onPhotoTaken }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [mode, setMode] = useState<CameraMode>("picture");
  const [facing, setFacing] = useState<CameraType>("back");

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>We need your permission to use the camera</Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  const takePicture = async () => {
    try {
      const photo = await ref.current?.takePictureAsync();
      if (photo?.uri) {
        setUri(photo.uri);
        if (onPhotoTaken) onPhotoTaken(photo.uri);
        Alert.alert("Photo taken", `Saved to temporary uri: ${photo.uri}`);
      }
    } catch (err) {
      console.error("CameraView takePicture error", err);
      Alert.alert("Error", "Failed to take picture");
    }
  };

  const toggleMode = () => setMode((m: CameraMode) => (m === "picture" ? "video" : "picture"));
  const toggleFacing = () => setFacing((f: CameraType) => (f === "back" ? "front" : "back"));

  return (
    <View style={styles.container}>
      {uri ? (
        <View style={styles.container}>
          <Text style={{ color: "white" }}>Photo captured</Text>
          <Button title="Take another" onPress={() => setUri(null)} />
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            ref={ref}
            mode={mode}
            facing={facing}
            mute={false}
            responsiveOrientationWhenOrientationLocked
          />
          <View style={styles.shutterContainer}>
            <Pressable onPress={toggleMode}>
              <Text style={{ color: "white" }}>{mode === "picture" ? "Pic" : "Vid"}</Text>
            </Pressable>
            <Pressable onPress={takePicture}>
              <View style={styles.shutterBtn}>
                <View style={[styles.shutterBtnInner, { backgroundColor: mode === "picture" ? "white" : "red" }]} />
              </View>
            </Pressable>
            <Pressable onPress={toggleFacing}>
              <Text style={{ color: "white" }}>Flip</Text>
            </Pressable>
          </View>
        </View>
      )}
      <View style={{ position: "absolute", top: 40, right: 12 }}>
        <Button title="Close" onPress={onClose} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  cameraContainer: StyleSheet.absoluteFillObject,
  shutterContainer: {
    position: "absolute",
    bottom: 44,
    left: 0,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  shutterBtn: {
    backgroundColor: "transparent",
    borderWidth: 5,
    borderColor: "white",
    width: 85,
    height: 85,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 50,
  },
});

export default CameraViewWrapper;
