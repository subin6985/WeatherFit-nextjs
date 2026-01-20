"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import FeedCard from '../../../components/FeedCard';
import GenderFilter from '../../../components/filter/GenderFilter';
import TempFilter from '../../../components/filter/TempFilter';
import { Gender, PostSummary, TempRange } from '../../../types';
import { getPosts } from '../../../lib/services/postService';
import Image from 'next/image';

export default function FeedPage() {
  const router = useRouter();
  const feedScrollRef = useRef<HTMLDivElement | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const [order, setOrder] = useState<'latest' | 'popular'>('latest');
  const [openOrder, setOpenOrder] = useState(false);
  const [tempRanges, setTempRanges] = useState<TempRange[]>([]);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [showTopBtn, setShowTopBtn] = useState(false);

  const [feeds, setFeeds] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    fetchInitialPosts();
  }, [order, tempRanges, genders]);

  const fetchInitialPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getPosts(null, 12, {
        tempRanges: tempRanges.length > 0 ? tempRanges : undefined,
        genders: genders.length > 0 ? genders : undefined,
        order,
      });

      setFeeds(result.posts);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : '피드를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchNextPage = async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);

      const result = await getPosts(lastDoc, 12, {
        tempRanges: tempRanges.length > 0 ? tempRanges : undefined,
        genders: genders.length > 0 ? genders : undefined,
        order,
      });

      setFeeds(prev => [...prev, ...result.posts]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (e) {
      console.error('Failed to load more posts:', e);
    } finally {
      setLoadingMore(false);
    }
  };

  // 무한 스크롤
  useEffect(() => {
    const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && hasMore && !loadingMore) {
            fetchNextPage();
          }
        },
        { threshold: 1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, lastDoc]);

  // 스크롤 이벤트 감지
  useEffect(() => {
    const el = feedScrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      setShowTopBtn(el.scrollTop > 10);
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    feedScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTempRangeSelect = (range: TempRange) => {
    setTempRanges(prev =>
        prev.includes(range) ? prev.filter(r => r !== range) : [...prev, range]
    );
  };

  const handleGenderSelect = (gen: Gender) => {
    setGenders(prev =>
        prev.includes(gen) ? prev.filter(g => g !== gen) : [...prev, gen]
    );
  };

  const handleOrder = (newOrder: 'latest' | 'popular') => {
    setOrder(newOrder);
    setOpenOrder(false);
  };

  if (error) return <div className="flex items-center justify-center h-screen">{error}</div>;

  return (
      <div className="flex flex-col overflow-hidden relative h-screen justify-start">
        <button onClick={() => router.push('/')} className="absolute left-[20px] top-[50px] z-10">
          <Image src="/Return.png" alt="뒤로가기" width={40} height={40} />
        </button>

        <button
            className="absolute w-[80px] h-[80px] right-[13px] bottom-[55px] rounded-full
                   bg-primary shadow-[2px_2px_4px_rgba(0,0,0,0.25)] flex items-center justify-center z-10"
            onClick={() => router.push('/write')}
        >
          <Image src="/Add.png" alt="글쓰기" width={50} height={50} />
        </button>

        <div className="w-full h-[100px] bg-white shadow-[0px_2px_5px_rgba(0,0,0,0.1)]" />

        <div ref={feedScrollRef} className="flex-1 overflow-y-auto no-scrollbar">
          <div className="ml-[28px] flex flex-row gap-x-[17px] mt-[17px]">
            <GenderFilter value={genders} onChange={handleGenderSelect} />
            <TempFilter value={tempRanges} onChange={handleTempRangeSelect} />
          </div>

          <div className="relative w-fit mt-[22px] ml-[28px] mb-[5px] text-[12px]">
            <button onClick={() => setOpenOrder(prev => !prev)}>
              {order === 'latest' ? '최신순▼' : '인기순▼'}
            </button>
            {openOrder && (
                <div className="absolute top-full mt-[5px] left-1/2 -translate-x-1/2
                            flex flex-col w-[60px] p-[5px] shadow-[2px_2px_4px_rgba(0,0,0,0.25)]
                            bg-white border-[1px] border-light rounded-[10px]">
                  <button
                      className="hover:bg-snow rounded p-[3px]"
                      onClick={() => handleOrder('latest')}
                  >
                    최신순
                  </button>
                  <button
                      className="hover:bg-snow rounded p-[3px]"
                      onClick={() => handleOrder('popular')}
                  >
                    인기순
                  </button>
                </div>
            )}
          </div>

          {loading ? (
              <div className="flex items-center justify-center py-20">로딩 중...</div>
          ) : (
              <div className="grid grid-cols-3 gap-[5px]">
                {feeds.map(feed => (
                    <FeedCard key={feed.id} feed={feed} />
                ))}
              </div>
          )}

          <div ref={loaderRef} className="h-10 flex items-center justify-center">
            {loadingMore && <span className="text-sm text-gray-500">로딩 중...</span>}
          </div>
        </div>

        {showTopBtn && (
            <button
                onClick={scrollToTop}
                className="fixed bottom-[50px] left-1/2 -translate-x-1/2
                     w-[48px] h-[48px] rounded-full bg-[rgba(0,0,0,0.5)] text-white
                     flex items-center justify-center shadow-lg z-50"
            >
              ↑
            </button>
        )}
      </div>
  );
}