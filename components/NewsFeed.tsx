import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, BookOpen, Heart, Globe, Newspaper, X, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { NewsItem } from '../types';
import { fetchNewsHeadlines, fetchFullArticle } from '../services/geminiService';

interface NewsFeedProps {
  onBack: () => void;
  themeColor: string;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ onBack, themeColor }) => {
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isArticleLoading, setIsArticleLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [nextUpdateIn, setNextUpdateIn] = useState(30);

  // Helper to get theme color styles dynamically for headers etc
  const getThemeClass = (type: 'bg' | 'text' | 'border', shade: number) => `${type}-${themeColor}-${shade}`;

  useEffect(() => {
    let isMounted = true;
    let timerInterval: any;

    const loadNews = async (forceRefresh: boolean) => {
      // Only show skeleton on initial load if we don't expect cache
      if (!forceRefresh) setIsLoading(true);
      
      try {
        const items = await fetchNewsHeadlines(forceRefresh);
        if (isMounted) {
          if (items && items.length > 0) {
            setNewsData(items);
            setLastUpdated(new Date());
            setNextUpdateIn(30); // Reset countdown
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error("News refresh failed", error);
        if (isMounted) setIsLoading(false);
      }
    };

    // Initial load: Use Cache if available (Fast) (forceRefresh = false)
    loadNews(false);

    // Auto-refresh interval (30 seconds): Force new data
    const refreshInterval = setInterval(() => {
      loadNews(true);
    }, 30000);

    // Countdown timer for UI effect
    timerInterval = setInterval(() => {
      setNextUpdateIn(prev => (prev > 0 ? prev - 1 : 30));
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
      clearInterval(timerInterval);
    };
  }, []);

  const handleArticleClick = async (news: NewsItem) => {
    setSelectedArticle(news);
    // If full content isn't present, fetch it
    if (!news.fullContent) {
      setIsArticleLoading(true);
      const { content, url } = await fetchFullArticle(news.title);
      
      // Update local state with the fetched content and URL if provided
      const updatedNews = { ...news, fullContent: content, url: url || news.url };
      setSelectedArticle(updatedNews);
      
      // Update the main list so we don't fetch again if re-opened
      setNewsData(prev => prev.map(item => item.id === news.id ? updatedNews : item));
      setIsArticleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 w-full font-sans animate-in slide-in-from-right duration-300 transition-colors duration-300">
      
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 shadow-sm transition-colors">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <Newspaper className={`w-5 h-5 ${getThemeClass('text', 600)}`} />
                Mental Health Insight
              </h1>
              <div className="flex items-center gap-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Real-time Feed</p>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full border border-green-100 dark:border-green-900/50">
                   <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                   <span className="text-[10px] font-bold uppercase tracking-wider">Live Updates</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-full">
            <RefreshCw className={`w-3 h-3 ${nextUpdateIn < 5 ? 'animate-spin text-blue-500' : ''}`} />
            <span>Updating in {nextUpdateIn}s</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
            {['All Updates', 'Research', 'Wellness', 'Community', 'Policy'].map((filter, i) => (
              <button 
                key={i}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  i === 0 
                  ? `${getThemeClass('bg', 600)} text-white shadow-md` 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 h-64 flex flex-col gap-4 animate-pulse">
                <div className="w-20 h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="w-full h-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="flex-1"></div>
                <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* News Grid */}
        {!isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsData.map((news) => (
              <article 
                key={news.id} 
                onClick={() => handleArticleClick(news)}
                className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col h-full group cursor-pointer hover:border-${themeColor}-300`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                    news.category === 'Research' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                    news.category === 'Community' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' :
                    news.category === 'Wellness' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {news.category}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {news.readTime}
                  </span>
                </div>
                
                <h3 className={`text-xl font-bold text-slate-800 dark:text-slate-100 mb-3 group-hover:${getThemeClass('text', 600)} transition-colors leading-snug`}>
                  {news.title}
                </h3>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 flex-1 leading-relaxed line-clamp-3">
                  {news.summary}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700 mt-auto">
                  <span className="text-xs text-slate-400 font-medium truncate max-w-[120px]">{news.source}</span>
                  <span className={`p-2 bg-slate-50 dark:bg-slate-700 rounded-full text-slate-400 group-hover:${getThemeClass('bg', 50)} group-hover:${getThemeClass('text', 600)} dark:group-hover:bg-slate-600 transition-colors`}>
                    <BookOpen className="w-4 h-4" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setSelectedArticle(null)}
          ></div>
          
          {/* Panel */}
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
             <button 
               onClick={() => setSelectedArticle(null)}
               className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors z-10"
             >
               <X className="w-6 h-6 text-slate-500" />
             </button>

             <div className={`h-64 ${getThemeClass('bg', 800)} relative shrink-0`}>
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="absolute bottom-0 left-0 p-8 w-full bg-gradient-to-t from-slate-900/90 to-transparent">
                   <div className={`inline-block px-3 py-1 ${getThemeClass('bg', 500)}/20 ${getThemeClass('text', 200)} text-xs font-bold uppercase tracking-wider rounded-lg mb-2 backdrop-blur-sm border border-white/10`}>
                     {selectedArticle.category}
                   </div>
                   <h1 className="text-3xl font-bold text-white leading-tight mb-2">{selectedArticle.title}</h1>
                   <div className="flex items-center gap-4 text-slate-300 text-sm">
                      <span>{selectedArticle.source}</span>
                      <span>•</span>
                      <span>{selectedArticle.date}</span>
                      {selectedArticle.url && (
                        <a 
                          href={selectedArticle.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-white underline decoration-dotted"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" /> Source
                        </a>
                      )}
                   </div>
                </div>
             </div>

             <div className="p-8 md:p-12">
               <div className="prose prose-lg dark:prose-invert prose-slate max-w-none">
                 <p className={`lead text-xl text-slate-600 dark:text-slate-300 font-medium italic border-l-4 ${getThemeClass('border', 500)} pl-4 mb-8`}>
                   {selectedArticle.summary}
                 </p>
                 
                 {isArticleLoading ? (
                   <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-4">
                     <Loader2 className={`w-8 h-8 animate-spin ${getThemeClass('text', 500)}`} />
                     <p>Searching web and generating article...</p>
                   </div>
                 ) : selectedArticle.fullContent ? (
                   <>
                    <div dangerouslySetInnerHTML={{ __html: selectedArticle.fullContent }} />
                    {selectedArticle.url && (
                       <div className="mt-12 p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                         <p className="text-sm text-slate-500 mb-3">Read the original source material</p>
                         <a 
                           href={selectedArticle.url}
                           target="_blank" 
                           rel="noopener noreferrer"
                           className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg ${getThemeClass('bg', 600)} text-white font-medium hover:opacity-90 transition-opacity`}
                         >
                           Open External Link <ExternalLink className="w-4 h-4" />
                         </a>
                       </div>
                    )}
                   </>
                 ) : (
                   <p className="text-slate-500 italic">Content unavailable.</p>
                 )}
               </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};