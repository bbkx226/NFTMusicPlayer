import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { FaVolumeUp } from "react-icons/fa";
import {
  MdOutlinePause,
  MdOutlinePlayArrow,
  MdOutlineRepeat,
  MdOutlineRepeatOne,
  MdOutlineShuffle,
  MdOutlineSkipNext,
  MdOutlineSkipPrevious
} from "react-icons/md";

import { IItem, repeatModes } from "../app/page";
import { PlaybackSlider } from "./PlaybackSlider";

interface IPlaybackBarProps {
  audioElement: React.RefObject<HTMLAudioElement>;
  currentAudioIndex: number;
  handleChangeSong: (isNext: boolean) => void;
  handleRepeatModeChange: () => void;
  handleShuffle: () => void;
  isAudioPlaying: boolean | null;
  isShuffle: boolean;
  playlist: IItem[];
  repeatMode: repeatModes;
  setIsAudioPlaying: Dispatch<SetStateAction<boolean>>;
}

const PlaybackBar: React.FC<IPlaybackBarProps> = ({
  audioElement,
  currentAudioIndex,
  handleChangeSong,
  handleRepeatModeChange,
  handleShuffle,
  isAudioPlaying,
  isShuffle,
  playlist,
  repeatMode,
  setIsAudioPlaying
}) => {
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [volume, setVolume] = useState(50);

  useEffect(() => {
    const currentAudio = audioElement.current; // Capture audioElement.current in a local variable

    const updateProgress = () => {
      if (currentAudio) {
        const currentTime = audioElement.current.currentTime;
        const duration = audioElement.current.duration;
        setElapsedTime(currentTime);
        const progress = (currentTime / duration) * 100;
        setPlaybackPosition(progress);
      }
    };

    if (currentAudio) {
      currentAudio.addEventListener("timeupdate", updateProgress);
      currentAudio.addEventListener("ended", () => handleChangeSong(true));
    }

    return () => {
      if (currentAudio) {
        currentAudio.removeEventListener("timeupdate", updateProgress);
        currentAudio.removeEventListener("ended", () => handleChangeSong(true));
      }
    };
  }, [audioElement, handleChangeSong]);

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

  const albumArtUrl = playlist[currentAudioIndex]?.identicon;
  const trackTitle = playlist[currentAudioIndex]?.name;
  const artist = playlist[currentAudioIndex]?.artist;
  const trackDuration = playlist[currentAudioIndex]?.duration;

  return (
    <div className="fixed bottom-0 left-0 right-0 text-white p-5 flex flex-col items-center justify-between glass rounded-none w-screen">
      <div className="fixed w-full -top-4 left-0">
        <PlaybackSlider handleSliderChange={handleSliderChange} playbackPosition={playbackPosition} />
      </div>
      <div className="grid grid-cols-3 w-full">
        <div className="flex justify-start items-center cursor-pointer">
          {albumArtUrl && <Image alt="Album Art" className="card-img-top" height={50} src={albumArtUrl} width={50} />}
          <div className="ml-4 text-left">
            <div className="text-lg font-semibold">{trackTitle}</div>
            <div className="text-sm text-gray-400">{artist}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 items-center">
          <div className="flex justify-center text-lg mr-4">
            {formatTime(elapsedTime)} / {formatTime(trackDuration)}
          </div>
          <div className="flex justify-center items-center">
            <Button onClick={() => handleChangeSong(false)} variant="ghost">
              <MdOutlineSkipPrevious className="w-8 h-8" />
            </Button>
            <Button onClick={() => setIsAudioPlaying(!isAudioPlaying)} variant="ghost">
              {isAudioPlaying ? <MdOutlinePause className="w-8 h-8" /> : <MdOutlinePlayArrow className="w-10 h-10" />}
            </Button>
            <Button onClick={() => handleChangeSong(true)} variant="ghost">
              <MdOutlineSkipNext className="w-8 h-8" />
            </Button>
          </div>
          <div className="flex justify-center items-center">
            <Button onClick={handleShuffle} variant="ghost">
              <MdOutlineShuffle className={cn("w-6 h-6 text-primary/50", { "text-primary": isShuffle })} />
            </Button>
            <Button onClick={handleRepeatModeChange} variant="ghost">
              {repeatMode === repeatModes.NONE ? (
                <MdOutlineRepeat className="w-6 h-6 text-primary/50" />
              ) : repeatMode === repeatModes.PLAYLIST ? (
                <MdOutlineRepeat className="w-6 h-6 text-primary" />
              ) : (
                <MdOutlineRepeatOne className="w-6 h-6 text-primary" />
              )}
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
