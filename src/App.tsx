import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { QuizPage } from './pages/QuizPage';
import { StoryPage } from './pages/StoryPage';
import { WritingPage } from './pages/WritingPage';
import { StatsPage } from './pages/StatsPage';
import { Settings } from './pages/Settings';
import { GrammarPage } from './pages/GrammarPage';
import { ExcelExportPage } from './pages/ExcelExportPage';
import { IELTSPage } from './pages/IELTSPage';
import { IELTSGenPage } from './pages/IELTSGenPage';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/flashcards" element={<FlashcardsPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/writing" element={<WritingPage />} />
          <Route path="/story" element={<StoryPage />} />
          <Route path="/grammar" element={<GrammarPage />} />
          <Route path="/export" element={<ExcelExportPage />} />
          <Route path="/ielts" element={<IELTSPage />} />
          <Route path="/ielts-samples" element={<IELTSGenPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
