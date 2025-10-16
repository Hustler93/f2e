import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Dumbbell, Play, Check, Loader } from 'lucide-react';
import { useWorkout } from '../hooks/useWorkout';
import { EXERCISES, REST_TIME_OPTIONS, DEFAULT_REST_TIME } from '../utils/constants';

export default function WorkoutApp() {
  const { connected, publicKey } = useWallet();
  const {
    initializeUser,
    getUserProfile,
    startSession,
    addSet,
    completeSession,
    loading,
    error
  } = useWorkout();

  const [userProfile, setUserProfile] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [sessionPubkey, setSessionPubkey] = useState(null);
  const [sessionSets, setSessionSets] = useState([]);
  
  const [currentExercise, setCurrentExercise] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [currentReps, setCurrentReps] = useState('');
  const [isSetActive, setIsSetActive] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(DEFAULT_REST_TIME);
  const [timer, setTimer] = useState(0);
  
  const timerRef = useRef(null);

  useEffect(() => {
    if (connected && publicKey) {
      loadUserProfile();
    }
  }, [connected, loadUserProfile, publicKey]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {
        // ignore - permissions can be denied without breaking the UI
      });
    }
  }, []);

  useEffect(() => {
    if (isSetActive || isResting) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isSetActive, isResting]);

  useEffect(() => {
    if (isResting && timer >= restTime) {
      handleRestComplete();
    }
  }, [timer, isResting, restTime]);

  const loadUserProfile = useCallback(async () => {
    try {
      const profile = await getUserProfile();
      setUserProfile(profile);
    } catch (err) {
      console.error('프로필 로드 실패:', err);
    }
  }, [getUserProfile]);

  const handleCreateProfile = async () => {
    const username = prompt('사용자 이름을 입력하세요:');
    if (!username) return;

    try {
      await initializeUser(username);
      await loadUserProfile();
      alert('프로필이 생성되었습니다!');
    } catch (err) {
      alert('프로필 생성 실패: ' + err.message);
    }
  };

  const handleStartWorkout = async () => {
    try {
      const result = await startSession();
      setSessionPubkey(result.sessionPubkey);
      setSessionSets([]);
      setCurrentView('workout');
    } catch (err) {
      alert('세션 시작 실패: ' + err.message);
    }
  };

  const startSetTimer = () => {
    if (!currentExercise || !currentWeight || !currentReps) {
      alert('운동, 무게, 횟수를 모두 입력해주세요');
      return;
    }

    setIsSetActive(true);
    setTimer(0);
  };

  const completeSetAndSave = async () => {
    try {
      const duration = timer;
      
      const weight = Number.parseInt(currentWeight, 10);
      const reps = Number.parseInt(currentReps, 10);

      if (!sessionPubkey) {
        throw new Error('세션이 시작되지 않았습니다. 다시 시도해주세요.');
      }

      await addSet(
        sessionPubkey,
        currentExercise,
        weight,
        reps,
        duration
      );

      const newSet = {
        id: Date.now(),
        exercise: currentExercise,
        weight,
        reps,
        duration: duration,
        timestamp: new Date().toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      setSessionSets(prev => [...prev, newSet]);
      setIsSetActive(false);
      setIsResting(true);
      setTimer(0);

    } catch (err) {
      alert('세트 저장 실패: ' + err.message);
      setIsSetActive(false);
    }
  };

  const handleRestComplete = () => {
    setIsResting(false);
    setTimer(0);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('휴식 완료!', { body: '다음 세트를 시작하세요' });
    }
  };

  const skipRest = () => {
    setIsResting(false);
    setTimer(0);
  };

  const changeExercise = (exercise) => {
    if (isSetActive || isResting) {
      if (!window.confirm('진행 중인 세트가 있습니다. 운동을 전환하시겠습니까?')) {
        return;
      }
      setIsSetActive(false);
      setIsResting(false);
    }
    setCurrentExercise(exercise);
  };

  const handleCompleteSession = async () => {
    if (sessionSets.length === 0) {
      alert('최소 1개의 세트를 완료해주세요');
      return;
    }

    try {
      await completeSession(sessionPubkey);
      
      const totalVolume = sessionSets.reduce((sum, set) => 
        sum + (set.weight * set.reps), 0
      );
      
      alert(
        `오늘의 운동 완료!\n` +
        `총 세트: ${sessionSets.length}\n` +
        `총 볼륨: ${totalVolume.toLocaleString()}kg`
      );
      
      setCurrentView('home');
      setSessionSets([]);
      setSessionPubkey(null);
      setCurrentExercise('');
      await loadUserProfile();
      
    } catch (err) {
      alert('세션 완료 실패: ' + err.message);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const stats = useMemo(() => {
    const totalVolume = sessionSets.reduce((sum, set) =>
      sum + (set.weight * set.reps), 0
    );
    const exerciseCount = new Set(sessionSets.map(s => s.exercise)).size;
    return { totalSets: sessionSets.length, totalVolume, exerciseCount };
  }, [sessionSets]);

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-purple-600 rounded-full mb-6">
            <Dumbbell size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">GymChain</h1>
          <p className="text-purple-300 mb-8">운동하고 보상받자</p>
          <WalletMultiButton />
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-md mx-auto p-6">
          <div className="absolute top-4 right-4">
            <WalletMultiButton />
          </div>

          <div className="text-center pt-20">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-purple-600 rounded-full mb-6">
              <Dumbbell size={48} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">환영합니다!</h1>
            <p className="text-purple-300 mb-8">
              프로필을 생성하고 운동을 시작하세요
            </p>

            <button
              onClick={handleCreateProfile}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105 disabled:opacity-50"
            >
              {loading ? <Loader className="inline animate-spin" /> : '프로필 생성하기'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-md mx-auto p-6">
          <div className="absolute top-4 right-4">
            <WalletMultiButton />
          </div>

          <div className="text-center mb-8 pt-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full mb-4">
              <Dumbbell size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">GymChain</h1>
            <p className="text-purple-300">안녕하세요, {userProfile.username}님!</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleStartWorkout}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-6 rounded-2xl font-bold text-xl shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105 disabled:opacity-50"
            >
              {loading ? (
                <Loader className="inline animate-spin" />
              ) : (
                <>
                  <Play className="inline mr-2" size={24} />
                  운동 시작하기
                </>
              )}
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-purple-300 text-sm mb-1">총 세션</div>
              <div className="text-white text-2xl font-bold">
                {userProfile.totalSessions.toString()}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-purple-300 text-sm mb-1">총 세트</div>
              <div className="text-white text-2xl font-bold">
                {userProfile.totalSets.toString()}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-purple-300 text-sm mb-1">총 볼륨</div>
              <div className="text-white text-xl font-bold">
                {(userProfile.totalVolume.toNumber() / 1000).toFixed(1)}T
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
            <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
              <button 
                onClick={() => setCurrentView('home')} 
                className="text-white"
                disabled={loading}
              >
                ← 뒤로
              </button>
              <div className="text-white text-center">
                <div className="text-sm text-purple-300">오늘의 운동</div>
                <div className="font-bold">{new Date().toLocaleDateString('ko-KR')}</div>
              </div>
              <button 
                onClick={handleCompleteSession} 
                disabled={loading}
                className="text-purple-400 font-medium disabled:opacity-50"
              >
                {loading ? <Loader className="inline animate-spin" size={16} /> : '완료'}
              </button>
            </div>
          </div>
    
          <div className="max-w-4xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              {/* 오늘 통계 */}
              <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-purple-300 text-xs">세트</div>
                    <div className="text-white text-xl font-bold">{stats.totalSets}</div>
                  </div>
                  <div>
                    <div className="text-purple-300 text-xs">볼륨</div>
                    <div className="text-white text-xl font-bold">
                      {stats.totalVolume.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-purple-300 text-xs">운동</div>
                    <div className="text-white text-xl font-bold">{stats.exerciseCount}</div>
                  </div>
                </div>
              </div>
    
              {/* 운동 선택 */}
              <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                <label className="text-purple-300 text-sm mb-2 block">운동 선택</label>
                <select
                  value={currentExercise}
                  onChange={(e) => changeExercise(e.target.value)}
                  disabled={isSetActive || isResting || loading}
                  className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  <option value="">운동을 선택하세요</option>
                  {EXERCISES.map(ex => (
                    <option key={ex} value={ex}>{ex}</option>
                  ))}
                </select>
              </div>
    
              {/* 무게와 횟수 */}
              {currentExercise && (
                <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-4 space-y-3">
                  <div>
                    <label className="text-purple-300 text-sm mb-2 block">무게 (kg)</label>
                    <input
                      type="number"
                      value={currentWeight}
                      onChange={(e) => setCurrentWeight(e.target.value)}
                      disabled={isSetActive || isResting || loading}
                      className="w-full bg-white/10 text-white text-2xl font-bold border border-white/20 rounded-xl px-4 py-3 text-center focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-purple-300 text-sm mb-2 block">횟수</label>
                    <input
                      type="number"
                      value={currentReps}
                      onChange={(e) => setCurrentReps(e.target.value)}
                      disabled={isSetActive || isResting || loading}
                      className="w-full bg-white/10 text-white text-2xl font-bold border border-white/20 rounded-xl px-4 py-3 text-center focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                      placeholder="0"
                    />
                  </div>
                </div>
              )}
    
              {/* 타이머 */}
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-center">
                <div className="text-white/80 text-sm mb-2">
                  {isSetActive ? '세트 진행 중' : isResting ? '휴식 시간' : loading ? '저장 중...' : '대기 중'}
                </div>
                <div className="text-white text-6xl font-bold mb-6">
                  {isResting ? formatTime(restTime - timer) : formatTime(timer)}
                </div>
    
                {!isSetActive && !isResting && (
                  <button
                    onClick={startSetTimer}
                    disabled={!currentExercise || !currentWeight || !currentReps || loading}
                    className="w-full bg-white text-purple-600 py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-50 transition"
                  >
                    <Play className="inline mr-2" size={20} />
                    세트 시작
                  </button>
                )}
    
                {isSetActive && (
                  <button
                    onClick={completeSetAndSave}
                    disabled={loading}
                    className="w-full bg-white text-purple-600 py-4 rounded-xl font-bold text-lg hover:bg-purple-50 transition disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader className="inline animate-spin" size={20} />
                    ) : (
                      <>
                        <Check className="inline mr-2" size={20} />
                        세트 완료
                      </>
                    )}
                  </button>
                )}
    
                {isResting && (
                  <button
                    onClick={skipRest}
                    className="w-full bg-white/20 text-white py-4 rounded-xl font-bold text-lg hover:bg-white/30 transition"
                  >
                    휴식 건너뛰기
                  </button>
                )}
              </div>
    
              {/* 휴식 시간 설정 */}
              {!isSetActive && !isResting && (
                <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                  <label className="text-purple-300 text-sm mb-2 block">휴식 시간 (초)</label>
                  <div className="flex gap-2">
                    {REST_TIME_OPTIONS.map(time => (
                      <button
                        key={time}
                        onClick={() => setRestTime(time)}
                        disabled={loading}
                        className={`flex-1 py-2 rounded-lg font-medium transition disabled:opacity-50 ${
                          restTime === time
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {time}s
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
    
            {/* 오른쪽: 오늘의 기록 */}
            <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
              <h3 className="text-white font-bold text-lg mb-4">오늘의 기록</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {sessionSets.length === 0 ? (
                  <div className="text-purple-300 text-center py-8">
                    첫 세트를 시작해보세요!
                  </div>
                ) : (
                  sessionSets.slice().reverse().map(set => (
                    <div 
                      key={set.id} 
                      className="bg-white/5 rounded-xl p-3 border border-white/10"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-white font-medium">{set.exercise}</div>
                        <div className="text-purple-300 text-xs">{set.timestamp}</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-white text-lg">
                          <span className="font-bold">{set.weight}</span>kg × 
                          <span className="font-bold ml-1">{set.reps}</span>회
                        </div>
                        <div className="text-purple-400 text-sm">
                          {(set.weight * set.reps).toLocaleString()}kg
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
