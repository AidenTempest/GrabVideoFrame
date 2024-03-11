import React, { useState } from 'react';
import { SafeAreaView, Dimensions, Pressable, Text, StyleSheet, View, ScrollView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker'; // Import from expo-image-picker
import { Video } from 'expo-av'; // Import Video from 'expo-av'
import FFmpegWrapper from '../../../lib/FFmpeg';

const FRAME_PER_SEC = 1;
const FRAME_WIDTH = 60; // Adjust the frame width
const SCREEN_WIDTH = Dimensions.get('screen').width;
const SCREEN_HEIGHT = Dimensions.get('screen').height;

const TILE_HEIGHT = 40; // Adjust the tile height
const TILE_WIDTH = FRAME_WIDTH / 2; // Adjust the tile width

const getFileNameFromPath = path => {
  if (!path) return ''; // Check if path is undefined or null

  const fragments = path.split('/');
  let fileName = fragments[fragments.length - 1];
  fileName = fileName.split('.')[0];
  return fileName;
};

const FRAME_STATUS = Object.freeze({
  LOADING: 'LOADING',
  READY: 'READY',
});

const App = () => {
  const [selectedVideo, setSelectedVideo] = useState(null); // {uri: <string>, localFileName: <string>, creationDate: <Date>}
  const [frames, setFrames] = useState(null); // <[{status: <FRAME_STATUS>}]>

  const handlePressSelectVideoButton = async () => {
    try {
      const videoAsset = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      });
  
      if (videoAsset && !videoAsset.cancelled) {
        console.log(`Selected video ${JSON.stringify(videoAsset, null, 2)}`);
        setSelectedVideo({
          uri: videoAsset.assets[0].uri, // Update this line to access the uri property from the assets array
          localFileName: getFileNameFromPath(videoAsset.assets[0].uri),
          creationDate: videoAsset.creationDate,
        });
        
        console.log("Selected video URI:", videoAsset.assets[0].uri); // New console log statement
      } else {
        console.log('Video selection cancelled');
      }
    } catch (error) {
      console.error('Error selecting video:', error);
    }
  };
  

  const handleVideoLoad = videoAssetLoaded => {
    if (selectedVideo) {
      const numberOfFrames = Math.ceil(videoAssetLoaded.duration);
      console.log('Video loaded:', videoAssetLoaded);
      setFrames(Array(numberOfFrames).fill({ status: FRAME_STATUS.LOADING }));
  
      FFmpegWrapper.getFrames(
        selectedVideo.localFileName,
        selectedVideo.uri,
        numberOfFrames,
        filePath => {
            const _frames = [];
            for (let i = 0; i < numberOfFrames; i++) {
                const framePath = `${filePath.replace('%4d', String(i + 1).padStart(4, 0))}.png`;
                console.log('Frame path:', framePath);
                _frames.push(framePath);
            }
            console.log('Frames:', _frames);
            setFrames(_frames);
        },
        () => {
            console.error('Error getting frames.');
        }
    );
    
    }
  };
  

  const renderFrame = (frame, index) => {
    if (frame.status === FRAME_STATUS.LOADING) {
      return <View style={styles.loadingFrame} key={index}></View>;
    } else {
      return (
        <Image
          key={index}
          source={{ uri: 'file://' + frame }}
          style={{
            width: TILE_WIDTH,
            height: TILE_HEIGHT,
          }}
        />
      );
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      {selectedVideo ? (
        <>
          <View style={styles.videoContainer}>
          <Video
  style={styles.video}
  resizeMode={'cover'}
  source={{ uri: selectedVideo.uri }}
  repeat={true}
  onLoad={handleVideoLoad}
  onError={(error) => console.error('Video Error:', error)}
  onPlaybackStatusUpdate={(status) => console.log('Playback Status Update:', status)}
/>
          </View>
          {frames && (
            <ScrollView
              showsHorizontalScrollIndicator={false}
              horizontal={true}
              style={styles.framesLine}
              alwaysBounceHorizontal={true}
              scrollEventThrottle={1}>
              {frames.map((frame, index) => renderFrame(frame, index))}
            </ScrollView>
          )}
        </>
      ) : (
        <Pressable
          style={styles.buttonContainer}
          onPress={handlePressSelectVideoButton}>
          <Text style={styles.buttonText}>Select a video</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  buttonText: {
    color: '#fff',
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: 0.6 * SCREEN_HEIGHT,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  video: {
    flex: 1,
  },
  framesLine: {
    width: SCREEN_WIDTH,
  },
  loadingFrame: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderColor: 'rgba(0,0,0,0.1)',
    borderWidth: 1,
  },
});

export default App;
