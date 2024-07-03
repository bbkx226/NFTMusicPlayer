import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useState } from "react";
import { FaPause, FaPlay, FaStepBackward, FaStepForward, FaVolumeUp } from "react-icons/fa";

interface PlaybackBarProps {
  albumArtUrl: string;
  artistName: string;
  trackTitle: string;
}

const PlaybackBar: React.FC<PlaybackBarProps> = ({ albumArtUrl, artistName, trackTitle }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(event.target.value));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 text-white p-4 flex items-center justify-between glass rounded-none">
      <div className="flex items-center">
        {/* <Image alt="Album Art" className="rounded" height={50} src={albumArtUrl} width={50} /> */}
        <Image alt="Album Art" className="card-img-top" height={50} src={albumArtUrl} width={50} />
        <div className="ml-4">
          <div className="text-lg font-semibold">{trackTitle}</div>
          <div className="text-sm text-gray-400">{artistName}</div>
        </div>
      </div>
      <div className="flex items-center">
        <Button variant="ghost">
          <FaStepBackward />
        </Button>
        <Button onClick={handlePlayPause} variant="ghost">
          {isPlaying ? <FaPause /> : <FaPlay />}
        </Button>
        <Button variant="ghost">
          <FaStepForward />
        </Button>
      </div>
      <div className="flex items-center">
        <FaVolumeUp className="mr-2" />
        <input className="w-24" max="1" min="0" onChange={handleVolumeChange} step="0.01" type="range" value={volume} />
      </div>
    </div>
  );
};

export default PlaybackBar;
