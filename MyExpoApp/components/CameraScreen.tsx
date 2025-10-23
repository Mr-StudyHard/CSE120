import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Button, Alert } from "react-native";

type CameraScreenProps = {
  onClose: () => void;
  onPhotoTaken?: (uri: string) => void;
};

// This component dynamically requires expo-camera at runtime to avoid
// bundling issues on web. It requests permission and shows a simple camera
// UI with a shutter button and flip camera.
export const CameraScreen: React.FC<CameraScreenProps> = ({ onClose, onPhotoTaken }) => {
  const cameraRef = useRef<any>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraModule, setCameraModule] = useState<any>(null);
  const [type, setType] = useState<"back" | "front">("back");
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // runtime require to avoid bundlers resolving native-only modules for web
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const r = eval("require");
        const cam = r("expo-camera");
        if (!mounted) return;
        setCameraModule(cam);
        // request permission
        const perm = await cam.requestCameraPermissionsAsync();
        if (!mounted) return;
        setHasPermission(perm.granted ?? false);
      } catch (err) {
        console.error("Camera load error", err);
        setHasPermission(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const takePicture = async () => {
    try {
      if (!cameraRef.current) return;
      const photo = await cameraRef.current.takePictureAsync();
      if (photo?.uri) {
        setPhotoUri(photo.uri);
        if (onPhotoTaken) onPhotoTaken(photo.uri);
        Alert.alert("Photo taken", "Saved to temporary uri: " + photo.uri);
      }
    } catch (err) {
      console.error("takePicture error", err);
      Alert.alert("Error", "Failed to take picture");
    }
  };

  const toggleFacing = () => {
    setType((prev: "back" | "front") => (prev === "back" ? "front" : "back"));
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <Text className="text-white">Requesting camera permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text className="text-white">No access to camera</Text>
        <Button title="Close" onPress={onClose} />
      </View>
    );
  }

  // If cameraModule is not loaded yet, show nothing
  if (!cameraModule) return null;

  const CameraComp = cameraModule.Camera ?? cameraModule.CameraView ?? cameraModule.default?.Camera;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={{ color: "white" }}>Close</Text>
        </Pressable>
      </View>

      {photoUri ? (
        <View style={styles.center}>
          <Text style={{ color: "white" }}>Photo captured</Text>
          <Button title="Take another" onPress={() => setPhotoUri(null)} />
        </View>
      ) : (
        <View style={styles.cameraWrap}>
          {/* @ts-ignore */}
          <CameraComp
            style={StyleSheet.absoluteFill}
            ref={cameraRef}
            type={type}
            ratio="16:9"
          />
          <View style={styles.controls}>
            <Pressable onPress={toggleFacing} style={styles.controlBtn}>
              <Text style={{ color: "white" }}>Flip</Text>
            </Pressable>
            <Pressable onPress={takePicture} style={styles.shutterBtn}>
              <View style={styles.shutterInner} />
            </Pressable>
            <View style={{ width: 64 }} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: { height: 60, justifyContent: "center", alignItems: "flex-end", padding: 12 },
  closeBtn: { padding: 8 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  cameraWrap: { flex: 1 },
  controls: { position: "absolute", bottom: 40, left: 0, right: 0, flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  controlBtn: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, borderColor: "white", justifyContent: "center", alignItems: "center" },
  shutterBtn: { width: 88, height: 88, borderRadius: 44, borderWidth: 6, borderColor: "white", justifyContent: "center", alignItems: "center" },
  shutterInner: { width: 68, height: 68, borderRadius: 34, backgroundColor: "white" },
});

export default CameraScreen;
