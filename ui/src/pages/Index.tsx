
import { Link } from 'react-router-dom';
import { ArrowRight, Upload, MessageCircle, FilePlus, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';

export default function Index() {
  const features = [
    {
      title: 'Upload Notes',
      description: 'Upload your notes in PDF, TXT, or DOCX format.',
      icon: Upload,
      color: 'bg-violet-500/20 text-violet-500'
    },
    {
      title: 'Ask AI',
      description: 'Ask questions about your notes and get instant answers.',
      icon: MessageCircle,
      color: 'bg-blue-500/20 text-blue-500'
    },
    {
      title: 'Summarize',
      description: 'Get concise summaries of your notes in various formats.',
      icon: FilePlus,
      color: 'bg-emerald-500/20 text-emerald-500'
    },
    {
      title: 'Listen',
      description: 'Convert your notes into podcasts and listen on the go.',
      icon: Headphones,
      color: 'bg-amber-500/20 text-amber-500'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 pt-28 pb-20 text-center">
        <div className="container max-w-4xl animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-400 to-blue-400 text-transparent bg-clip-text">
            Transform Your Notes into Knowledge
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Upload your study materials, ask questions, get summaries, and listen to your notes as podcasts — all with the power of AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link to="/dashboard">
                Get Started <ArrowRight size={18} />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/dashboard">
                Explore Features
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-card p-6 rounded-lg hover-scale border border-border/40"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className={`rounded-full w-12 h-12 flex items-center justify-center mb-4 ${feature.color}`}>
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            EduNotes AI makes learning more efficient and accessible in just a few simple steps.
          </p>
          
          <div className="space-y-10">
            {[
              {
                step: '01',
                title: 'Upload Your Notes',
                description: 'Simply drag and drop your study materials. We support PDF, TXT, and DOCX files.'
              },
              {
                step: '02',
                title: 'Ask Questions',
                description: 'Ask specific questions about your notes and get accurate answers powered by AI.'
              },
              {
                step: '03',
                title: 'Generate Summaries',
                description: 'Create concise summaries of your notes in various formats to aid your studying.'
              },
              {
                step: '04',
                title: 'Listen On The Go',
                description: 'Convert your notes to audio and continue learning while commuting or exercising.'
              }
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="text-2xl font-bold text-primary">{item.step}</div>
                <div>
                  <h3 className="text-xl font-medium mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Button asChild size="lg">
              <Link to="/dashboard">Start Using EduNotes AI</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="mt-auto py-12 px-4 bg-card/30 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">E</span>
                </div>
                <span className="font-bold text-lg">EduNotes AI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Transform your study materials with AI.
              </p>
            </div>
            <div className="flex gap-8">
              <Link to="/dashboard" className="text-sm hover:text-primary transition-colors">Dashboard</Link>
              <Link to="/settings" className="text-sm hover:text-primary transition-colors">Settings</Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} EduNotes AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
