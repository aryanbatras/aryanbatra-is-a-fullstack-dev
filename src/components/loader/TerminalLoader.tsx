import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/components/TerminalLoader.module.css';

export default function TerminalLoader() {
  const [lines, setLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const commands = [
    'Aryans-MacBook-Pro:$ next start',
    '',
    'Server: 64.29.17.195:3000',
    'Production: aryanbatra-is-a-fullstack-dev.vercel.app',
    '',
    'Next.js 16.1.6 server started',
    'Route: / -> index.js',
    'GET / 200',
    'GET /api/profile 200',
    'GET /api/projects 200',
    'POST /api/analytics 201',
    '',
    'React 19.2.3',
    'Three.js 0.182.0',
    'React Three Fiber 9.5.0',
    'React Three Drei 10.7.7',
    'React Three PostProcessing 3.0.4',
    'Framer Motion 12.34.1',
    'PostProcessing 6.38.2',
    'Tailwind CSS 4',
    'TypeScript 5',
    '',
    'Optimizing',
    'Deploying',
    '...',
  ];

  useEffect(() => {
    const typeCommands = async () => {
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        setIsTyping(true);
        setCurrentLine('');
        
        const baseSpeed = 8;
        
        for (let j = 0; j <= command.length; j++) {
          await new Promise(resolve => setTimeout(resolve, baseSpeed + Math.random() * 8));
          setCurrentLine(command.slice(0, j));
        }
        
        setLines(prev => [...prev, command]);
        setCurrentLine('');
        setIsTyping(false);
        
        // Minimal professional delays
        let delay = 25 + Math.random() * 15;
        if (command.includes('GET') || command.includes('POST')) delay = 35;
        if (command === '') delay = 8;
        if (i < commands.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    };

    typeCommands();
  }, []);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 1000);

    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    if (lines.length === commands.length && !isTyping) {
      const timeout = setTimeout(() => {
        router.push('/');
      }, 1500);

      return () => clearTimeout(timeout);
    }
  }, [lines.length, isTyping, router]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines, currentLine]);

  const getLineClass = (line: string) => {
    if (line.includes('Last login')) return styles.login;
    if (line.includes('Aryans-MacBook-Pro')) return styles.command;

    return styles.text;
  };

  return (
    <div className={styles.terminal}>
      <div className={styles.header}>
        <div className={styles.buttons}>
          <span className={styles.button + ' ' + styles.red}></span>
          <span className={styles.button + ' ' + styles.yellow}></span>
          <span className={styles.button + ' ' + styles.green}></span>
        </div>
        <div className={styles.title}>Aryans-MacBook-Pro — aryanbatra — zsh</div>
      </div>
      <div className={styles.content} ref={terminalRef}>
        {lines.map((line, index) => (
          <div key={index} className={styles.line}>
            <span className={getLineClass(line)}>{line}</span>
          </div>
        ))}
        {(currentLine || isTyping) && (
          <div className={styles.line}>
            <span className={styles.text}>
              {currentLine}
              {showCursor && <span className={styles.cursor}>█</span>}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}