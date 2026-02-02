'use client';

import { useRouter } from 'next/navigation';
import { PostSummary } from '../../types';

interface FeedCardProps {
  feed: PostSummary;
}

export default function FeedCard({ feed }: FeedCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/post/${feed.id}`);
  };

  return (
      <button className="w-[127px] overflow-hidden" onClick={handleClick}>
        {feed.photo ? (
            <img
                src={feed.photo}
                alt="피드 이미지"
                width={127}
                height={127}
                className="w-full h-[127px] object-cover"
            />
        ) : (
            <div className="w-full h-[127px] bg-light" />
        )}
      </button>
  );
}