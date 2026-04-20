"use client";

import { useState, useEffect } from 'react';

interface YouTubeReel {
  id: string;
  thumbnail: string;
  title: string;
  videoUrl: string;
  likes: number;
  comments: number;
}

const DEFAULT_REELS: YouTubeReel[] = [
  {
    id: '1',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=320&h=568&fit=crop',
    title: 'New Arrivals Just Dropped! 🔥',
    videoUrl: 'https://youtube.com/shorts/demo1',
    likes: 2450,
    comments: 156
  },
  {
    id: '2',
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=320&h=568&fit=crop',
    title: 'Top 5 Best Sellers This Week',
    videoUrl: 'https://youtube.com/shorts/demo2',
    likes: 1890,
    comments: 89
  },
  {
    id: '3',
    thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=320&h=568&fit=crop',
    title: 'Insane Flash Sale Live Now! ⏰',
    videoUrl: 'https://youtube.com/shorts/demo3',
    likes: 5670,
    comments: 423
  },
  {
    id: '4',
    thumbnail: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=320&h=568&fit=crop',
    title: 'Unboxing Our Latest Products',
    videoUrl: 'https://youtube.com/shorts/demo4',
    likes: 3340,
    comments: 278
  },
  {
    id: '5',
    thumbnail: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=320&h=568&fit=crop',
    title: 'Customer Favorites Under $50',
    videoUrl: 'https://youtube.com/shorts/demo5',
    likes: 4120,
    comments: 301
  },
];

export default function VideoReelsSection() {
  const [reels, setReels] = useState<YouTubeReel[]>(DEFAULT_REELS);
  const [loading, setLoading] = useState(true);
  const [selectedReel, setSelectedReel] = useState<YouTubeReel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const fetchReels = async () => {
      try {
        const response = await fetch(`${apiUrl}/youtube-shorts`);
        const data = await response.json();
        setReels(data);
      } catch (error) {
        console.error('Error fetching YouTube shorts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReels();
  }, []);

  const openReel = (reel: YouTubeReel) => {
    setSelectedReel(reel);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReel(null);
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  return (
    <>
      <section className='py-12 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden relative'>
        <div 
          className='absolute inset-0 opacity-10'
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        <div className='relative max-w-7xl mx-auto px-4 sm:px-6 mb-8'>
          <div className='text-center'>
            
            <h2 className='text-2xl md:text-4xl font-bold bg-gradient-to-r from-white via-pink-200 to-purple-200 bg-clip-text text-transparent'>
              Our Latest Videos
            </h2>
            
            <a 
              href='https://youtube.com/@ecomzone21' 
              target='_blank' 
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105'
            >
              <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M21.582 12.01c0 .837-.583 1.262-1.675 1.52L17 13.445v6.458c0 .737-.537 1.097-1.61 1.097H4.414c-1.073 0-1.61-.36-1.61-1.097v-15.3c0-.737 .537-1.097 1.61-1.097h10.976c1.073 0 1.61 .36 1.61 1.097v4.551l2.582-.955c1.092-.258 1.675 .683 1.675 1.52zM13.97 11.485l4.423 2.326c.215 .113 .33 .328 .33 .562v1.03c0 .234-.115 .45-.33 .562l-4.423 2.326v-2.64h-5.16v-2.593h5.16v-2.64z'/>
              </svg>
              Follow @instagram
            </a>
          </div>
        </div>

        {loading ? (
          <div className='flex justify-center py-20'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500'></div>
          </div>
        ) : (
          <div className='relative'>
            <div className='flex gap-4 md:gap-6 overflow-x-auto pb-4 px-4 md:px-6 scrollbar-hide'>
              {[...reels, ...reels].map((reel, index) => (
                <div 
                  key={`${reel.id}-${index}`}
                  className='flex-shrink-0 cursor-pointer group'
                  onClick={() => openReel(reel)}
                >
                  <div className='w-40 md:w-48 relative'>
                    <div className='aspect-[9/16] rounded-2xl overflow-hidden bg-gray-800 shadow-2xl group-hover:shadow-purple-500/30 transition-all duration-300 group-hover:scale-105'>
                      <img 
                        src={reel.thumbnail} 
                        alt={reel.title}
                        className='w-full h-full object-cover'
                        loading='lazy'
                      />
                      <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent' />
                      
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <div className='w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                          <svg className='w-6 h-6 text-white ml-1' fill='currentColor' viewBox='0 0 24 24'>
                            <path d='M8 5v14l11-7z'/>
                          </svg>
                        </div>
                      </div>

                      <div className='absolute bottom-0 left-0 right-0 p-3'>
                        <p className='font-medium text-sm text-white truncate'>{reel.title}</p>
                        <div className='flex items-center gap-3 mt-1'>
                          <span className='text-xs text-gray-300 flex items-center gap-1'>
                            <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 24 24'>
                              <path d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 18.58 3 21 5.42 21 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/>
                            </svg>
                            {formatCount(reel.likes)}
                          </span>
                          <span className='text-xs text-gray-300 flex items-center gap-1'>
                            <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 24 24'>
                              <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'/>
                            </svg>
                            {formatCount(reel.comments)}
                          </span>
                        </div>
                      </div>

                      {/* <div className='absolute top-3 left-3'>
                        <div className='flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full'>
                          <svg className='w-3 h-3 text-red-500' fill='currentColor' viewBox='0 0 24 24'>
                            <path d='M21.582 16.582c0 .837-.583 1.262-1.675 1.52L17 18.445v6.458c0 .737-.537 1.097-1.61 1.097H4.414c-1.073 0-1.61-.36-1.61-1.097v-15.3c0-.737 .537-1.097 1.61-1.097h10.976c1.073 0 1.61 .36 1.61 1.097v4.551l2.582-.955c1.092-.258 1.675 .683 1.675 1.52zM13.97 15.485l4.423 2.326c.215 .113 .33 .328 .33 .562v1.03c0 .234-.115 .45-.33 .562l-4.423 2.326v-2.64h-5.16v-2.593h5.16v-2.64z'/>
                          </svg>
                          <span className='text-xs text-white'>Shorts</span>
                        </div>
                      </div> */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* <div className='text-center mt-6'>
          <p className='text-xs text-gray-500'>← Swipe to view more →</p>
        </div> */}
      </section>

      {isModalOpen && selectedReel && (
        <div 
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm'
          onClick={closeModal}
        >
          <div 
            className='relative w-full max-w-lg bg-gray-900 rounded-2xl overflow-hidden shadow-2xl'
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={closeModal}
              className='absolute top-3 right-3 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors'
            >
              <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>

            <div className='aspect-[9/16] bg-gray-800 flex items-center justify-center'>
              <div className='text-center p-8'>
                <div className='w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-red-600 to-red-500 rounded-full flex items-center justify-center'>
                  <svg className='w-10 h-10 text-white' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M8 5v14l11-7z'/>
                  </svg>
                </div>
                <h3 className='text-xl font-bold text-white mb-2'>{selectedReel.title}</h3>
                <p className='text-gray-400 mb-4'>Watch on YouTube</p>
                <a 
                  href={selectedReel.videoUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 rounded-full font-medium hover:from-red-700 hover:to-red-600 transition-all'
                >
                  <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M21.582 12.01c0 .837-.583 1.262-1.675 1.52L17 13.445v6.458c0 .737-.537 1.097-1.61 1.097H4.414c-1.073 0-1.61-.36-1.61-1.097v-15.3c0-.737 .537-1.097 1.61-1.097h10.976c1.073 0 1.61 .36 1.61 1.097v4.551l2.582-.955c1.092-.258 1.675 .683 1.675 1.52zM13.97 11.485l4.423 2.326c.215 .113 .33 .328 .33 .562v1.03c0 .234-.115 .45-.33 .562l-4.423 2.326v-2.64h-5.16v-2.593h5.16v-2.64z'/>
                  </svg>
                  Watch Short
                </a>
              </div>
            </div>

            <div className='p-4 border-t border-gray-800'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-6'>
                  <button className='flex items-center gap-2 text-white hover:text-red-500 transition-colors'>
                    <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 24 24'>
                      <path d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 18.58 3 21 5.42 21 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/>
                    </svg>
                    <span>{formatCount(selectedReel.likes)}</span>
                  </button>
                  <button className='flex items-center gap-2 text-white hover:text-red-500 transition-colors'>
                    <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 24 24'>
                      <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'/>
                    </svg>
                    <span>{formatCount(selectedReel.comments)}</span>
                  </button>
                </div>
                <a 
                  href='https://youtube.com/@ecomzone21'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-red-500 hover:text-red-400 text-sm font-medium'
                >
                  @ecomzone21
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
