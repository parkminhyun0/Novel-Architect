
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import IdeaInputForm from './components/IdeaInputForm';
import NovelPlanDisplay from './components/NovelPlanDisplay';
import HistoryPanel from './components/HistoryPanel';
import { generateNovelPlan } from './services/geminiService';

export interface HistoryItem {
  id: string;
  idea: string;
  planHtml: string;
  timestamp: number;
}

const App: React.FC = () => {
  const [idea, setIdea] = useState<string>('');
  const [novelPlanHtml, setNovelPlanHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('novelArchitectHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
      // If parsing fails, clear the corrupted data
      localStorage.removeItem('novelArchitectHistory');
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('novelArchitectHistory', JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save history to localStorage", error);
    }
  }, [history]);

  const handleGeneratePlan = useCallback(async () => {
    if (!idea.trim()) {
      setError('웹소설 아이디어를 입력해주세요.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setNovelPlanHtml('');

    try {
      const plan = await generateNovelPlan(idea);
      setNovelPlanHtml(plan);
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        idea,
        planHtml: plan,
        timestamp: Date.now(),
      };
      setHistory(prevHistory => [newHistoryItem, ...prevHistory]);
      setSelectedHistoryId(newHistoryItem.id);
    } catch (e) {
      console.error(e);
      setError('기획안 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [idea]);

  const handleSelectHistory = (item: HistoryItem) => {
    setIdea(item.idea);
    setNovelPlanHtml(item.planHtml);
    setSelectedHistoryId(item.id);
    setError(null); // Clear any existing errors when loading from history
  };

  const handleDeleteHistory = (idToDelete: string) => {
    setHistory(prevHistory => prevHistory.filter(item => item.id !== idToDelete));
  };

  const handleClearHistory = () => {
    if (window.confirm('정말로 모든 히스토리를 삭제하시겠습니까?')) {
      setHistory([]);
      setIdea('');
      setNovelPlanHtml('');
      setSelectedHistoryId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-screen-2xl mx-auto">
        <Header />
        <div className="mt-8 flex flex-col lg:flex-row gap-8">
          <main className="flex-grow lg:w-2/3 flex flex-col gap-8">
            <IdeaInputForm
              idea={idea}
              setIdea={setIdea}
              onSubmit={handleGeneratePlan}
              isLoading={isLoading}
            />
            <NovelPlanDisplay
              planHtml={novelPlanHtml}
              isLoading={isLoading}
              error={error}
            />
          </main>
          <aside className="lg:w-1/3 lg:max-w-md">
             <HistoryPanel
                history={history}
                selectedId={selectedHistoryId}
                onSelect={handleSelectHistory}
                onDelete={handleDeleteHistory}
                onClear={handleClearHistory}
              />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default App;
