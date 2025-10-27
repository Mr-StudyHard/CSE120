import { CameraView, useCameraPermissions } from "expo-camera";
import { Camera, ImageIcon, Loader2 } from "lucide-react-native";
import * as React from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { readAsStringAsync } from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { extractTextFromImage, USING_DEMO_OCR_KEY, postProcessOcrText, scoreOcrText, refineTextWithOpenAI, HAS_OPENAI_KEY } from "@/utils/ocr";
import { Share } from "react-native";

export default function HomeScreen() {
  const [extractedText, setExtractedText] = React.useState<string>("");
  const [isHeaderHidden, setIsHeaderHidden] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [showCamera, setShowCamera] = React.useState(false);
    // accuracyLevel: 'fast' | 'high' | 'very-high' (mutually exclusive)
    const [accuracyLevel, setAccuracyLevel] = React.useState<'fast' | 'high' | 'very-high'>("high");
  const [language, setLanguage] = React.useState<string>("eng");
  const [provider, setProvider] = React.useState<"ocrspace" | "openai" | "best">(HAS_OPENAI_KEY ? "best" : "ocrspace");
  const [isInputFocused, setIsInputFocused] = React.useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const insets = useSafeAreaInsets();

  type OcrProfile = {
    width: number;
    compress: number;
    engine: 1 | 2;
    format: "jpeg" | "png";
  };

  const handleOCR = async () => {
    setIsHeaderHidden(true);
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Camera Permission",
          "Camera permission is required to scan text from images."
        );
        return;
      }
    }

    setShowCamera(true);
  };

  const handleCaptureBatch = async (photos: Array<{ uri: string; base64?: string; width?: number; height?: number; framing?: FramingInfo }>) => {
    setShowCamera(false);
    setIsHeaderHidden(false);
    setIsProcessing(true);

    try {
      const profiles: OcrProfile[] = USING_DEMO_OCR_KEY
        ? [
            { width: 1080, compress: 0.9, engine: 1 as const, format: "png" as const },
            { width: 900, compress: 0.85, engine: 1 as const, format: "png" as const },
            { width: 720, compress: 0.7, engine: 1 as const, format: "jpeg" as const },
            { width: 576, compress: 0.65, engine: 1 as const, format: "jpeg" as const },
          ]
        : [
            { width: 1600, compress: 0.92, engine: 2 as const, format: "png" as const },
            { width: 1440, compress: 0.9, engine: 2 as const, format: "png" as const },
            { width: 1280, compress: 0.88, engine: 2 as const, format: "jpeg" as const },
            { width: 1024, compress: 0.82, engine: 2 as const, format: "jpeg" as const },
            { width: 864, compress: 0.75, engine: 1 as const, format: "jpeg" as const },
            { width: 720, compress: 0.7, engine: 1 as const, format: "jpeg" as const },
          ];

      let lastError: Error | null = null;
      let bestText: string | null = null;
      let bestScore = -Infinity;

      for (const photo of photos) {
        for (let attempt = 0; attempt < profiles.length; attempt++) {
          const profile = profiles[attempt];

          try {
            const preparedImage = await prepareImageForOCR(
              photo,
              profile.width,
              profile.compress,
              profile.format,
              photo.framing,
              0
            );
            const rawText = await extractTextFromImage(preparedImage.base64, {
              fileUri: preparedImage.uri,
              mimeType: preparedImage.mimeType,
              ocrEngine: profile.engine,
              language,
              provider,
              retries: 2,
              retryDelayMs: 2000,
            });

            const cleaned = postProcessOcrText(rawText);
            const score = scoreOcrText(cleaned);
            if (score > bestScore) {
              bestScore = score;
              bestText = cleaned;
            }

            lastError = null;
            if (accuracyLevel === "fast") {
              break; // fast path: first good result
            }
            if (score < 25) {
              // Try rotated fallbacks if result seems weak
              for (const deg of [90, 270]) {
                try {
                  const rotated = await prepareImageForOCR(
                    photo,
                    profile.width,
                    profile.compress,
                    profile.format,
                    undefined,
                    deg
                  );
                  const rawRot = await extractTextFromImage(rotated.base64, {
                    fileUri: rotated.uri,
                    mimeType: rotated.mimeType,
                    ocrEngine: profile.engine,
                    language,
                    provider,
                    retries: 1,
                    retryDelayMs: 1000,
                  });
                  const cleanedRot = postProcessOcrText(rawRot);
                  const scoreRot = scoreOcrText(cleanedRot);
                  if (scoreRot > bestScore) {
                    bestScore = scoreRot;
                    bestText = cleanedRot;
                  }
                } catch {}
              }
            }
          } catch (innerError) {
            lastError = innerError instanceof Error ? innerError : new Error("Failed to extract text from image.");
            // brief pause between attempts so the OCR provider can reset
            await delay(500 * (attempt + 1));
          }
        }
      }

      if (lastError) {
        throw lastError;
      }
  const finalText = await refineTextWithOpenAI(bestText ?? "", language);
  setExtractedText(finalText);
    } catch (error) {
      console.error("OCR Error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to extract text from image. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (showCamera) {
    return <CameraScreen onCapture={handleCaptureBatch} onClose={() => {
      setShowCamera(false);
      setIsHeaderHidden(false);
    }} />;
  }

  return (
    <>
  <Stack.Screen options={{ headerShown: !isHeaderHidden, title: "" }} />
      <View style={styles.container}>
        <View style={{ paddingTop: isHeaderHidden ? insets.top : 0, backgroundColor: "#F9FAFB", flex: 1 }}>
        <View style={styles.header}>
          {/* header icon removed per request (imagedToremove) */}
          <Text style={styles.title}>OCR Scanner</Text>
          <Text style={styles.subtitle}>Scan text from images</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.textContainer}>
            <View style={styles.textHeader}>
              {/* Left: centered pill controls; Right: inline keyboard toolbar when editing */}
              <View style={styles.pillRowWrapper}>
                <View style={styles.pillRow}>
                  <TouchableOpacity
                    onPress={() => setAccuracyLevel("high")}
                    style={[styles.pill, accuracyLevel === "high" ? styles.pillRed : styles.pillGray]}
                  >
                    <Text style={[styles.pillText, accuracyLevel === "high" ? styles.pillTextRed : styles.pillTextGray]}>High accuracy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setLanguage((prev) => (prev === "eng" ? "spa" : prev === "spa" ? "fra" : "eng"))}
                    style={[styles.pill, styles.pillBlue]}
                  >
                    <Text style={[styles.pillText, styles.pillTextBlue]}>{language.toUpperCase()}</Text>
                  </TouchableOpacity>

                  {/* Provider toggle (shown only if OpenAI key exists) */}
                  {HAS_OPENAI_KEY && (
                    <View style={styles.providerRow}>
                      <TouchableOpacity
                        onPress={() => setProvider("best")}
                        style={[styles.pill, provider === "best" ? styles.pillGray : styles.pillLightGray]}
                      >
                        <Text style={[styles.pillText, provider === "best" ? styles.pillTextGray : styles.pillTextLightGray]}>Best</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setProvider("ocrspace")}
                        style={[styles.pill, provider === "ocrspace" ? styles.pillGray : styles.pillLightGray]}
                      >
                        <Text style={[styles.pillText, provider === "ocrspace" ? styles.pillTextGray : styles.pillTextLightGray]}>OCR.Space</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setProvider("openai")}
                        style={[styles.pill, provider === "openai" ? styles.pillGray : styles.pillLightGray]}
                      >
                        <Text style={[styles.pillText, provider === "openai" ? styles.pillTextGray : styles.pillTextLightGray]}>OpenAI</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={() => setAccuracyLevel("very-high")}
                    style={[styles.pill, accuracyLevel === "very-high" ? styles.pillRed : styles.pillLightGray]}
                  >
                    <Text style={[styles.pillText, accuracyLevel === "very-high" ? styles.pillTextRed : styles.pillTextLightGray]}>Very high</Text>
                  </TouchableOpacity>
                </View>

                {isInputFocused && (
                  <View style={styles.inlineToolbar}>
                    <TouchableOpacity
                      onPress={() => { setExtractedText(""); Keyboard.dismiss(); setIsInputFocused(false); }}
                      style={styles.toolbarClear}
                    >
                      <Text style={styles.toolbarClearText}>Clear</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => { Keyboard.dismiss(); setIsInputFocused(false); }}
                      style={styles.toolbarDone}
                    >
                      <Text style={styles.toolbarDoneText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              {isProcessing ? (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="large" color="#6366F1" />
                  <Text style={styles.processingText}>Processing image...</Text>
                </View>
              ) : extractedText ? (
                <TextInput
                  style={styles.textInput}
                  value={extractedText}
                  onChangeText={setExtractedText}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  multiline
                  allowFontScaling={false}
                  placeholder="Extracted text will appear here..."
                  placeholderTextColor="#9CA3AF"
                  editable={!isProcessing}
                />
              ) : (
                <View style={styles.emptyState}>
                    {/* intentionally no image icon to match design */}
                    <Text style={styles.emptyText}>No text scanned yet</Text>
                    <Text style={styles.emptySubtext}>
                      Tap the OCR button below to scan text from an image
                    </Text>
                  </View>
              )}
            </ScrollView>
          </View>

          {/* previously a floating keyboard toolbar; replaced with inline toolbar next to pills */}

          <TouchableOpacity
            style={[styles.ocrButton, isProcessing && styles.ocrButtonDisabled]}
            onPress={handleOCR}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <View style={styles.ocrButtonContent}>
              <View style={styles.iconWrap}>
                {isProcessing ? (
                  <Loader2 size={20} color="#6366F1" />
                ) : (
                  <Camera size={20} color="#6366F1" strokeWidth={2} />
                )}
              </View>
              <Text style={styles.ocrButtonText}>
                {isProcessing ? "Processing..." : "Scan Text"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        </View>
      </View>
    </>
  );
}
type PreparedImage = {
  base64: string;
  uri: string;
  mimeType: string;
};

type FramingInfo = {
  screenWidth: number;
  screenHeight: number;
  frameTop: number;
  frameLeft: number;
  frameWidth: number;
  frameHeight: number;
};

async function prepareImageForOCR(
  image: { uri: string; base64?: string; width?: number; height?: number },
  targetWidth: number,
  compress: number,
  format: "jpeg" | "png",
  framing?: FramingInfo,
  rotateDeg?: number
): Promise<PreparedImage> {
  try {
    // Build operations: optional crop to focus frame, then resize
    const operations: ImageManipulator.Action[] = [];

    if (rotateDeg && rotateDeg % 360 !== 0) {
      operations.push({ rotate: rotateDeg as any });
    }

    // Only attempt frame-aligned crop when not rotating
    if (!rotateDeg && framing && image.width && image.height) {
      const iw = image.width;
      const ih = image.height;
      const frameAR = framing.frameWidth / framing.frameHeight;
      const imageAR = iw / ih;

      // Center crop to match the frame aspect ratio
      let cropW: number;
      let cropH: number;
      if (imageAR > frameAR) {
        // image wider than frame
        cropH = ih;
        cropW = Math.round(ih * frameAR);
      } else {
        cropW = iw;
        cropH = Math.round(iw / frameAR);
      }

      // Shift crop vertically to align with on-screen frame center
      const frameCenterY = framing.frameTop + framing.frameHeight / 2;
      const screenCenterY = framing.screenHeight / 2;
      const normY = (frameCenterY - screenCenterY) / Math.max(1, framing.screenHeight);
      const baseY = (ih - cropH) / 2;
      let originY = Math.round(baseY + normY * ih);
      originY = Math.max(0, Math.min(ih - cropH, originY));

  // Horizontal alignment: allow slight shift if frame isn't exactly centered
  const frameCenterX = framing.frameLeft + framing.frameWidth / 2;
  const screenCenterX = framing.screenWidth / 2;
  const normX = (frameCenterX - screenCenterX) / Math.max(1, framing.screenWidth);
  const baseX = (iw - cropW) / 2;
  let originX = Math.round(baseX + normX * iw);
      originX = Math.max(0, Math.min(iw - cropW, originX));

      operations.push({ crop: { originX, originY, width: cropW, height: cropH } });
    }

  operations.push({ resize: { width: targetWidth } });

    const manipulated = await ImageManipulator.manipulateAsync(image.uri, operations, {
      compress,
      format: format === "png" ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });

    const optimizedUri = manipulated.uri ?? image.uri;
    const base64 = manipulated.base64
      ? manipulated.base64
      : await readAsStringAsync(optimizedUri, {
          encoding: "base64",
        });

    return {
      base64,
      uri: optimizedUri,
      mimeType: format === "png" ? "image/png" : "image/jpeg",
    };
  } catch (error) {
    console.warn("Image optimization failed, falling back to original image", error);
  }

  const fallbackBase64 =
    image.base64 && image.base64.length > 0
      ? image.base64
      : await readAsStringAsync(image.uri, {
          encoding: "base64",
        });

  return {
    base64: fallbackBase64,
    uri: image.uri,
    mimeType: "image/jpeg",
  };
}

function CameraScreen({
  onCapture,
  onClose,
}: {
  onCapture: (photos: Array<{ uri: string; base64?: string; width?: number; height?: number; framing?: FramingInfo }>) => void;
  onClose: () => void;
}) {
  const [isTakingPhoto, setIsTakingPhoto] = React.useState(false);
  const cameraRef = React.useRef<any>(null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [zoom, setZoom] = React.useState(0);
  const [captureStep, setCaptureStep] = React.useState<0 | 1 | 2 | 3>(0); // debug overlay

  const takePicture = async () => {
    if (!cameraRef.current || isTakingPhoto) return;

    setIsTakingPhoto(true);
    try {
  const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));
  const baseZoom = zoom; // treat current as baseline
  const DELTA_IN = 0.1;  // second photo: subtle zoom-in
  const DELTA_OUT = 0.7; // third photo: stronger zoomed-out
  const zPlus = clamp(baseZoom + DELTA_IN, 0, 1);
  const zMinus = clamp(baseZoom - DELTA_OUT, 0, 1);

      const captureAtZoom = async (z: number, step: 1 | 2 | 3) => {
        setCaptureStep(step);
        setZoom(z);
        await delay(1000); // one second between captures for comparison
        const p = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 1,
          skipProcessing: false,
        });
        return p;
      };

      const photosRaw: any[] = [];
      // 1) original zoom
      const p0 = await captureAtZoom(baseZoom, 1);
      if (p0) photosRaw.push(p0);
      // 2) from original, zoomed in by +0.5
      const p1 = await captureAtZoom(zPlus, 2);
      if (p1) photosRaw.push(p1);
      // 3) from original, zoomed out by -0.5
      const p2 = await captureAtZoom(zMinus, 3);
      if (p2) photosRaw.push(p2);

      // restore original zoom and clear step after a brief moment
      setZoom(baseZoom);
      setTimeout(() => setCaptureStep(0), 300);

      const enriched = photosRaw.map((photo) => ({
        uri: photo.uri,
        base64: photo.base64,
        width: (photo as any).width,
        height: (photo as any).height,
        framing: {
          screenWidth: windowWidth,
          screenHeight: windowHeight,
          frameTop: maskTopHeight,
          frameLeft: frameLeft,
          frameWidth: frameWidth,
          frameHeight: frameHeight,
        },
      }));
      if (enriched.length > 0) {
        onCapture(enriched);
      }
    } catch (error) {
      console.error("Camera Error:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
    setIsTakingPhoto(false);
  };

  const insets = useSafeAreaInsets();
  const frameWidth = Math.min(windowWidth * 0.82, 340);
  const frameHeight = frameWidth * 1.15;
  // Lift the scanning frame higher to reduce congestion near the shutter area
  const verticalOffset = Math.min(100, windowHeight * 0.12);
  const frameTop = Math.max((windowHeight - frameHeight) / 2 - verticalOffset, insets.top + 12);
  const frameLeft = Math.max((windowWidth - frameWidth) / 2, 0);
  const maskTopHeight = Math.max(frameTop, 0);
  const maskBottomTop = frameTop + frameHeight;
  // Keep instructions comfortably above the shutter area
  const instructionsTop = Math.min(maskBottomTop + 24, windowHeight - (insets.bottom + 220));

  return (
    <View style={styles.cameraContainer}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" zoom={zoom} />
      {captureStep !== 0 && (
        <View style={styles.captureStepBadge} pointerEvents="none">
          <Text style={styles.captureStepText}>{captureStep}/3</Text>
        </View>
      )}
      <View style={styles.cameraOverlay} pointerEvents="box-none">
        <View pointerEvents="none">
          <View
            style={[styles.mask, { top: 0, left: 0, right: 0, height: maskTopHeight }]}
          />
          <View
            style={[styles.mask, { top: maskBottomTop, left: 0, right: 0, bottom: 0 }]}
          />
          <View
            style={[
              styles.mask,
              { top: maskTopHeight, left: 0, width: frameLeft, height: frameHeight },
            ]}
          />
          <View
            style={[
              styles.mask,
              { top: maskTopHeight, right: 0, width: frameLeft, height: frameHeight },
            ]}
          />
        </View>

        <View style={[styles.cameraTopBar, { paddingTop: insets.top + 12 }]}
          pointerEvents="box-none">
          <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityRole="button">
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.focusFrame,
            {
              width: frameWidth,
              height: frameHeight,
              top: maskTopHeight,
              left: frameLeft,
            },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.focusCorner, styles.cornerTopLeft]} />
          <View style={[styles.focusCorner, styles.cornerTopRight]} />
          <View style={[styles.focusCorner, styles.cornerBottomLeft]} />
          <View style={[styles.focusCorner, styles.cornerBottomRight]} />
        </View>

        <View
          style={[
            styles.instructionsContainer,
            {
              top: instructionsTop,
              paddingHorizontal: frameLeft + 24,
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.instructionsText}>Position text within the frame</Text>
          <Text style={styles.instructionsSubtext}>Hold steady and ensure good lighting.</Text>
        </View>

        <View style={[styles.cameraFooter, { paddingBottom: insets.bottom + 40 }]}>
          <TouchableOpacity
            style={[styles.captureButton, isTakingPhoto && styles.captureButtonDisabled]}
            onPress={takePicture}
            disabled={isTakingPhoto}
            activeOpacity={0.8}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  textContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    marginBottom: 20,
  },
  textHeader: {
    // header now contains centered pill controls
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    alignItems: "center",
  },
  textLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#374151",
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#FEE2E2",
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#DC2626",
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  pillRowWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    gap: 12,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  pillGreen: {
    backgroundColor: "#DCFCE7",
  },
  pillTextGreen: {
    color: "#16A34A",
  },
  pillGray: {
    backgroundColor: "#F3F4F6",
  },
  pillTextGray: {
    color: "#374151",
  },
  pillBlue: {
    backgroundColor: "#E0E7FF",
  },
  pillTextBlue: {
    color: "#4338CA",
  },
  pillLightGray: {
    backgroundColor: "#F3F4F6",
  },
  pillTextLightGray: {
    color: "#6B7280",
  },
  providerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pillRed: {
    backgroundColor: "#FEE2E2",
  },
  pillTextRed: {
    color: "#DC2626",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  textInput: {
    flex: 1,
    padding: 16,
    // Smaller, tighter typography so more words fit per line
    fontSize: 14,
    lineHeight: 20,
    color: "#111827",
    // Make the visible text area larger to accommodate more content
    minHeight: 320,
    textAlignVertical: "top",
  },
  processingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#374151",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  ocrButton: {
    backgroundColor: "#6366F1",
    borderRadius: 999,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 10,
    marginHorizontal: 8,
  },
  ocrButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0.1,
  },
  ocrButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  inlineToolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toolbarClear: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  toolbarClearText: {
    color: "#374151",
    fontWeight: "600" as const,
  },
  toolbarDone: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#6366F1",
  },
  toolbarDoneText: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
  ocrButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraTopBar: {
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  closeButtonText: {
    fontSize: 28,
    lineHeight: 28,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  mask: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  focusFrame: {
    position: "absolute",
  },
  focusCorner: {
    position: "absolute",
    width: 48,
    height: 48,
    borderColor: "#FFFFFF",
    borderWidth: 4,
    borderRadius: 6,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  instructionsContainer: {
    position: "absolute",
    width: "100%",
  },
  instructionsText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    textAlign: "center",
  },
  instructionsSubtext: {
    marginTop: 6,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  cameraFooter: {
    alignItems: "center",
    justifyContent: "flex-end",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
  },
  captureStepBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  captureStepText: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
});
