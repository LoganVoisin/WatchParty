import ReactPlayer from 'react-player';
import { useState, useEffect, useRef } from 'react';
import {
  Container, ProgressBar, Form, Row, Col,
} from 'react-bootstrap';
import { LButton } from '../../styles';
import { Playlist } from './Playlist';
import { Participants } from './Participants';

function Video({
  playlist,
  setPlaylist,
  participants,
  setParticipants,
  status,
  room,
  user,
  socket,
}) {
  // state vars
  const [isPlaying, setPause] = useState(() => !status);
  const [pSeconds, setSeconds] = useState(0.0001);
  const [duration, setDur] = useState(1);
  const [volume, setVol] = useState(0.5);
  const [video, setVid] = useState(0);

  const videoPlayer = useRef<ReactPlayer>(null);
  if (status) {
    socket.on('roomCheck', () => {
      socket.emit('giveRoom', {
        room: room.id,
        video,
        start: pSeconds,
        playing: isPlaying,
      });
    });
  }
  // functions

  // Plays next video in playlist
  const changeVid = (bool) => {
    setSeconds(0);
    if (bool) {
      if (video < playlist.length) {
        socket.emit('giveRoom', {
          room: room.id,
          video: video + 1,
          start: pSeconds,
          playing: isPlaying,
        });
        setVid(video + 1);
      } else {
        socket.emit('giveRoom', {
          room: room.id,
          video,
          start: pSeconds,
          playing: isPlaying,
        });
      }
    } else {
      socket.emit('giveRoom', {
        room: room.id,
        video: video ? video - 1 : video,
        start: pSeconds,
        playing: isPlaying,
      });
      setVid(video ? video - 1 : video);
    }
    videoPlayer.current.seekTo(0, 'seconds');
  };

  // updates volume
  const setVolume = (e) => {
    setVol(e.target.value / 100);
  };

  // Updates the duration
  const setDuration = () => {
    setDur(videoPlayer.current.getDuration());
  };

  // pauses all clients
  const pauseVid = () => {
    setPause(false);
    socket.emit('pause', { room: room.id, bool: false });
    socket.emit('seek', { room: room.id, amount: pSeconds });
    videoPlayer.current.seekTo(pSeconds, 'seconds');
  };
  // plays all clients
  const playVid = () => {
    socket.emit('play', { room: room.id, bool: true });
  };
  const updateTime = (data) => {
    setSeconds(data.playedSeconds);
  };

  // updates once
  useEffect(() => {
    socket.on('pause', (arg: boolean) => {
      setPause(arg);
    });
    socket.on('play', (arg: boolean) => {
      setPause(arg);
    });
    socket.on('seek', (seconds: number) => {
      videoPlayer.current.seekTo(seconds, 'seconds');
      setSeconds(seconds);
    });

    socket.on(
      'giveRoom',
      (video: {
				room: any;
				video: number;
				start: number;
				playing: boolean;
			}) => {
        setVid(video.video);
        setPause(() => {
          videoPlayer.current.seekTo(video.start, 'seconds');
          return video.playing;
        });
        setSeconds(video.start);
      },
    );

    return () => {
      socket.off('pause');
      socket.off('play');
      socket.off('seek');
      socket.off('giveRoom');
    };
  }, []);
  // Positioning of playlist and participants needs work
  return (
    <Container
      fluid="md"
      style={{
			  height: '100%',
			  float: 'left',
			  marginLeft: '0px',
      }}
    >
      <Row style={{ position: 'absolute', width: '100%', maxHeight: '85%' }}>
        <Col md={2}>
          <Playlist
            room={room}
            playlist={playlist}
            setPlaylist={setPlaylist}
            status={status}
          />
        </Col>
        <Col md={2}>
          <Participants
            room={room}
            status={status}
            participants={participants}
            setParticipants={setParticipants}
          />
        </Col>
      </Row>
      <ReactPlayer
        ref={videoPlayer}
        config={{
				  youtube: {
				    playerVars: {
				      controls: 0,
				      color: 'white',
				    },
				  },
        }}
        onEnded={() => {
				  changeVid(true);
        }}
        onStart={setDuration}
        volume={volume}
        onDuration={setDuration}
        onProgress={updateTime}
        playing={isPlaying}
        url={
					playlist[video]
					  ? playlist[video].url
					  : 'https://www.youtube.com/watch?v=vZa0Yh6e7dw'
				}
        width="100%"
        height="85%"
        style={{
				  pointerEvents: 'none',
        }}
      />
      <ProgressBar variant="info" now={pSeconds} max={duration} min={0} />
      <Container fluid="md" style={{ height: '1.5rm', width: '10%' }}>
        <Form.Range value={volume * 100} onChange={setVolume} />
      </Container>
      <LButton disabled={!status} onClick={playVid}>
        Play
      </LButton>
      {' '}
      <LButton disabled={!status} onClick={pauseVid}>
        Pause
      </LButton>
      {' '}
      <LButton disabled={!status} onClick={() => changeVid(false)}>
        Back
      </LButton>
      {' '}
      <LButton disabled={!status} onClick={() => changeVid(true)}>
        Next
      </LButton>
    </Container>
  );
}
export default Video;
