import React from 'react';
import { ArrowLeft, Clock, BookOpen, Heart, Globe, Newspaper } from 'lucide-react';
import { NewsItem } from '../types';

interface NewsFeedProps {
  onBack: () => void;
}

const NEWS_DATA: NewsItem[] = [
  {
    id: '1',
    title: "The Global Crisis of Connection",
    summary: "New studies from the WHO indicate that loneliness is now a critical global health threat, with impacts comparable to smoking 15 cigarettes a day. Researchers emphasize community-building as a primary intervention.",
    source: "World Health Organization / Global Health",
    date: "Oct 2023",
    category: "Research",
    readTime: "5 min read"
  },
  {
    id: '2',
    title: "Living with High-Functioning Anxiety",
    summary: "\"I smiled through every meeting while my heart raced at 120bpm.\" Sarah shares her personal journey of masking anxiety in a corporate environment and finding the courage to ask for accommodations.",
    source: "Community Voices",
    date: "Recent",
    category: "Community",
    readTime: "8 min read"
  },
  {
    id: '3',
    title: "Youth Mental Health: The Screen Time Debate",
    summary: "A meta-analysis of 50 studies reveals a complex relationship between social media and teen depression. It's not just about time spent, but *how* the time is spent.",
    source: "Journal of Adolescent Health",
    date: "Sept 2023",
    category: "Research",
    readTime: "12 min read"
  },
  {
    id: '4',
    title: "The Rise of Eco-Anxiety",
    summary: "As climate change accelerates, therapists report a surge in patients expressing hopelessness about the future. New therapeutic frameworks are emerging to help people process environmental grief.",
    source: "APA Monitor",
    date: "Aug 2023",
    category: "Wellness",
    readTime: "6 min read"
  },
  {
    id: '5',
    title: "Men's Mental Health: Breaking the Silence",
    summary: "Statistics show men are less likely to seek therapy despite high suicide rates. A look at the grassroots movements changing the definition of masculinity.",
    source: "NIMH Statistics",
    date: "2023 Report",
    category: "Policy",
    readTime: "4 min read"
  },
  {
    id: '6',
    title: "Sleep Hygiene as First-Line Defense",
    summary: "Before medication, doctors are increasingly prescribing rigorous sleep protocols. Evidence suggests fixing circadian rhythms can reduce depressive symptoms by up to 40%.",
    source: "Sleep Foundation",
    date: "Nov 2023",
    category: "Wellness",
    readTime: "7 min read"
  }
];

export const NewsFeed: React.FC<NewsFeedProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50 w-full font-sans animate-in slide-in-from-right duration-300">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-teal-600" />
              Mental Health Insight
            </h1>
            <p className="text-xs text-slate-500">Latest Research & Shared Stories</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Featured Article */}
        <section className="bg-gradient-to-br from-teal-900 to-teal-800 rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-600 rounded-full opacity-20 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-teal-800/50 border border-teal-600/50 px-3 py-1 rounded-full text-xs font-medium mb-4">
              <Globe className="w-3 h-3" /> Global Report
            </div>
            <h2 className="text-2xl md:text-4xl font-bold mb-4 leading-tight">The State of Mental Health in 2024</h2>
            <p className="text-teal-100 text-lg mb-6 leading-relaxed">
              Despite rising awareness, the "treatment gap" remains significant. 
              We explore the systemic barriers preventing access to care and the digital innovations trying to bridge the divide.
            </p>
            <button className="bg-white text-teal-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-teal-50 transition-colors">
              Read Full Report
            </button>
          </div>
        </section>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All Updates', 'Research', 'Personal Stories', 'Wellness Tips', 'Policy'].map((filter, i) => (
            <button 
              key={i}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                i === 0 
                ? 'bg-teal-600 text-white shadow-md shadow-teal-200' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* News Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {NEWS_DATA.map((news) => (
            <article key={news.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col h-full group cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                  news.category === 'Research' ? 'bg-blue-50 text-blue-700' :
                  news.category === 'Community' ? 'bg-rose-50 text-rose-700' :
                  news.category === 'Wellness' ? 'bg-emerald-50 text-emerald-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {news.category}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {news.readTime}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-teal-700 transition-colors leading-snug">
                {news.title}
              </h3>
              
              <p className="text-sm text-slate-600 mb-6 flex-1 leading-relaxed">
                {news.summary}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                <span className="text-xs text-slate-400 font-medium">{news.source}</span>
                <span className="p-2 bg-slate-50 rounded-full text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                  <BookOpen className="w-4 h-4" />
                </span>
              </div>
            </article>
          ))}
        </div>

        <section className="bg-slate-800 rounded-3xl p-8 text-center text-slate-300 mt-12">
           <Heart className="w-8 h-8 mx-auto mb-4 text-rose-400" />
           <h3 className="text-white text-xl font-bold mb-2">Have a story to share?</h3>
           <p className="max-w-lg mx-auto mb-6 text-sm">
             Sharing your journey can help others feel less alone. MindFlow collects anonymous stories to help improve our understanding of human struggle.
           </p>
           <button className="text-white border border-slate-600 px-6 py-2 rounded-full text-sm hover:bg-slate-700 transition-colors">
             Submit Anonymous Story
           </button>
        </section>

      </main>
    </div>
  );
};
