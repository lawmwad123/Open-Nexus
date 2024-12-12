import { Audio } from 'expo-av';

class AudioManager {
  private static instance: AudioManager;
  private currentSound: Audio.Sound | null = null;
  private soundCallback: ((progress: number, isPlaying: boolean) => void) | null = null;

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async play(
    audioUri: string, 
    onProgressUpdate: (progress: number, isPlaying: boolean) => void
  ) {
    // Stop any currently playing sound
    await this.stop();

    try {
      // Create and play new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );

      this.currentSound = newSound;
      this.soundCallback = onProgressUpdate;

      // Setup sound status update listener
      newSound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded) {
          const progress = status.positionMillis / status.durationMillis;
          
          // Trigger callback with progress and playing status
          if (this.soundCallback) {
            this.soundCallback(
              progress, 
              status.isPlaying && !status.didJustFinish
            );
          }

          // Automatically stop when finished
          if (status.didJustFinish) {
            await this.stop();
          }
        }
      });

    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  async stop() {
    if (this.currentSound) {
      await this.currentSound.stopAsync();
      await this.currentSound.unloadAsync();
      this.currentSound = null;

      // Reset callback
      if (this.soundCallback) {
        this.soundCallback(0, false);
        this.soundCallback = null;
      }
    }
  }

  async togglePlay() {
    if (!this.currentSound) return;

    const status = await this.currentSound.getStatusAsync();
    if (status.isLoaded) {
      if (status.isPlaying) {
        await this.currentSound.pauseAsync();
      } else {
        await this.currentSound.playAsync();
      }
    }
  }
}

export default AudioManager;