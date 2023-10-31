import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { PermissionsAndroid } from 'react-native';
import RNFS from 'react-native-fs'; // Import the react-native-fs library
import { orientation } from 'react-native-sensors';
import { setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';

function App(): JSX.Element {
  const devices = useCameraDevices();
  const device = devices.back;
  const camera = useRef<Camera>(null);
  const videoFilePath = RNFS.ExternalDirectoryPath + '/capturedVideo.mp4'; // Define the path for the saved video

  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [yaw, setYaw] = useState(0);

  let orientationSubscription: any;

  useEffect(() => {
    const startOrientationSubscription = async () => {
      // Check camera permissions
      const newCameraPermission = await Camera.requestCameraPermission();
      const newMicrophonePermission = await Camera.requestMicrophonePermission();

      // Set the update interval for the orientation sensor to 500 milliseconds
      setUpdateIntervalForType(SensorTypes.orientation, 500);

      // Subscribe to the orientation sensor
      orientationSubscription = orientation.subscribe(({ pitch, roll, yaw }) => {
        setPitch(pitch);
        setRoll(roll);
        setYaw(yaw);
      });
    };

    startOrientationSubscription();

    // Cleanup function
    return () => {
      if (orientationSubscription) {
        orientationSubscription.unsubscribe();
      }
    };
  }, []);

  const startRecording = async () => {
    if (camera.current !== null) {
      try {
        await camera.current.startRecording({
          onRecordingFinished: async (video) => {
            console.log('Video path:', video.path);
            await RNFS.moveFile(video.path, videoFilePath); // Move the recorded video to your desired path
            console.log('Video saved:', videoFilePath);
          },
          onRecordingError: (error) => console.error(error),
        });
      } catch (error) {
        console.error('Failed to start recording:', error);
      }
    }
  };

  const stopRecording = async () => {
    if (camera.current !== null) {
      await camera.current.stopRecording();
    }
  };

  if (device == null) return <ActivityIndicator />;
  return (
    <View style={styles.all}>
      <View style={styles.camera}>
        <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          video={true}
          audio={true}
          zoom={1}
        />
        <TouchableOpacity onPress={startRecording} style={styles.captureButton}>
          <Text style={{ fontSize: 18, marginBottom: 10, color: 'white' }}>Start Recording</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={stopRecording} style={styles.captureButton}>
          <Text style={{ fontSize: 18, marginBottom: 10, color: 'white' }}>Stop Recording</Text>
        </TouchableOpacity>
        {/* Display the orientation data on the screen */}
        <Text style={{ fontSize: 16, color: 'white' }}>Pitch: {pitch.toFixed(2)}°</Text>
        <Text style={{ fontSize: 16, color: 'white' }}>Roll: {roll.toFixed(2)}°</Text>
        <Text style={{ fontSize: 16, color: 'white' }}>Yaw: {yaw.toFixed(2)}°</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  all: {
    flex: 1,
  },
  camera: {
    flex: 1,
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
  },
});

export default App;
