import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { FaPause, FaPlay, FaStepBackward, FaStepForward, FaVolumeUp } from "react-icons/fa";

import { IItem } from "../app/page";

interface IPlaybackBarProps {
  audioElement: React.RefObject<HTMLAudioElement>;
  changeSong: (isNext: boolean) => void;
  currentAudioIndex: number;
  isAudioPlaying: boolean;
  marketItems: IItem[];
  setCurrentAudioIndex: Dispatch<SetStateAction<number>>;
  setIsAudioPlaying: Dispatch<SetStateAction<boolean>>;
}

const PlaybackBar: React.FC<IPlaybackBarProps> = ({
  audioElement,
  changeSong,
  currentAudioIndex,
  isAudioPlaying,
  marketItems,
  setIsAudioPlaying
}) => {
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [volume, setVolume] = useState(50);

  useEffect(() => {
    const currentAudio = audioElement.current; // Capture audioElement.current in a local variable

    const updateProgress = () => {
      if (currentAudio) {
        const currentTime = audioElement.current.currentTime;
        const duration = audioElement.current.duration;
        setElapsedTime(currentTime);
        setTotalTime(duration);
        const progress = (currentTime / duration) * 100;
        setPlaybackPosition(progress);
      }
    };

    if (currentAudio) {
      currentAudio.addEventListener("timeupdate", updateProgress);
      currentAudio.addEventListener("ended", () => changeSong(true));
    }

    return () => {
      if (currentAudio) {
        currentAudio.removeEventListener("timeupdate", updateProgress);
        currentAudio.removeEventListener("ended", () => changeSong(true));
      }
    };
  }, [audioElement, changeSong]);

  useEffect(() => {
    if (audioElement.current) {
      audioElement.current.volume = volume / 100; // Set the volume to the value of the volume state
    }
  }, [audioElement, volume]);

  useEffect(() => {
    if (audioElement.current) {
      if (isAudioPlaying) {
        audioElement.current.play();
      } else {
        audioElement.current.pause();
      }
    }
  }, [isAudioPlaying, audioElement, currentAudioIndex]);

  const handlePlayPause = () => {
    setIsAudioPlaying(!isAudioPlaying);
  };

  const handleSliderChange = (value: number[]) => {
    if (audioElement.current) {
      const newTime = (value[0] / 100) * audioElement.current.duration;
      audioElement.current.currentTime = newTime;
      setPlaybackPosition(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const albumArtUrl = marketItems[currentAudioIndex]?.identicon;
  const trackTitle = marketItems[currentAudioIndex]?.name;

  return (
    <div className="fixed bottom-0 left-0 right-0 text-white p-5 flex flex-col items-center justify-between glass rounded-none">
      <Slider
        className="fixed w-full -top-4 left-0"
        defaultValue={[0]}
        max={100}
        min={0}
        onValueChange={handleSliderChange}
        step={1}
        value={[playbackPosition]}
      />
      <div className="grid grid-cols-3 w-full">
        <div className="flex justify-start items-center cursor-pointer">
          {albumArtUrl && <Image alt="Album Art" className="card-img-top" height={50} src={albumArtUrl} width={50} />}
          <div className="ml-4">
            <div className="text-lg font-semibold">{trackTitle}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 items-center">
          <div className="flex justify-end text-lg mr-4">
            {formatTime(elapsedTime)} / {formatTime(totalTime)}
          </div>
          <div>
            <Button onClick={() => changeSong(false)} variant="ghost">
              <FaStepBackward />
            </Button>
            <Button onClick={handlePlayPause} variant="ghost">
              {isAudioPlaying ? <FaPause /> : <FaPlay />}
            </Button>
            <Button onClick={() => changeSong(true)} variant="ghost">
              <FaStepForward />
            </Button>
          </div>
        </div>
        <div className="flex justify-end items-center">
          <FaVolumeUp className="mr-2" />
          <Slider
            className="w-24"
            defaultValue={[volume]}
            max={100}
            min={0}
            onValueChange={handleVolumeChange}
            step={1}
          />
        </div>
      </div>
    </div>
  );
};

export default PlaybackBar;
