"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import FeedCard from './FeedCard';
import GenderFilter from '../filter/GenderFilter';
import TempFilter from '../filter/TempFilter';
import { Gender, PostSummary, TempRange } from '../../types';

interface FeedGridProps {
  title?: string;
  showWriteButton?: boolean;
  fetchFunction: (
      lastDoc: DocumentSnapshot | null,
      pageSize: number,
      filters?: {
        tempRanges?: TempRange[];
        genders?: Gender[];
        order?: 'latest' | 'popular';
      }
  ) => Promise<{
    posts: PostSummary[];
    lastDoc: DocumentSnapshot | null;
    hasMore: boolean;
  }>;
  emptyMessage?: string;
}

export default function FeedGrid({
                                   title,
                                   showWriteButton = false,
                                   fetchFunction,
                                   emptyMessage = '게시물이 없습니다.'
                                 }: FeedGridProps) {
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

  const ref = useRef<HTMLDivElement>(null);

  // 초기 데이터 로드
  useEffect(() => {
    fetchInitialPosts();
  }, [order, tempRanges, genders]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpenOrder(false);
      }
    };

    if (openOrder) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openOrder]);

  const fetchInitialPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await fetchFunction(null, 12, {
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
    if (!hasMore || loadingMore || !lastDoc) return;

    try {
      setLoadingMore(true);

      const result = await fetchFunction(lastDoc, 12, {
        tempRanges: tempRanges.length > 0 ? tempRanges : undefined,
        genders: genders.length > 0 ? genders : undefined,
        order,
      });

      setFeeds(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newPosts = result.posts.filter(post => !existingIds.has(post.id));
        return [...prev, ...newPosts];
      });
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
      <div className="flex flex-col flex-1 relative justify-start">
        {showWriteButton && (
            <button
                className="fixed w-[70px] h-[70px] bottom-[55px] right-[32%] -translate-x-1/2 rounded-full
                            bg-primary shadow-[2px_2px_4px_rgba(0,0,0,0.25)] flex items-center justify-center z-10
                            hover:scale-95 transition-all duration-100 ease-in-out"
                onClick={() => router.push('/write')}
            >
              <img src="/Add.png" alt="글쓰기" width={40} height={40}/>
            </button>
        )}

        {title && (
            <div className="absolute -top-[45px] left-[70px] z-20">
              <h1 className="text-[22px]">{title}</h1>
            </div>
        )}

        <div ref={feedScrollRef} className="flex-1 overflow-y-auto no-scrollbar">
          <div className="ml-[28px] flex flex-row gap-x-[17px] mt-[17px]">
            <GenderFilter value={genders} onChange={handleGenderSelect} />
            <TempFilter value={tempRanges} onChange={handleTempRangeSelect} />
          </div>

          <div className="relative w-fit mt-[22px] ml-[28px] mb-[5px] text-[12px]"
               ref={ref}>
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
          ) : feeds.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-middle">
                {emptyMessage}
              </div>
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