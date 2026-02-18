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
    'Last login: ' + new Date().toLocaleString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    '',
    'Aryans-MacBook-Pro:aryanbatra$' , 
    '',
    'next dev',
    '  ▲ Next.js 16.1.6',
    '  - Local:        http://localhost:3000',
    '  - Environments: .env.local',
    '',
    '  ✓ Ready in 1.8s',
    '',
    '  ⚡ React 19.2.3 initialized',
    '  ⚡ TypeScript 5.x configured',
    '  ⚡ Tailwind CSS 4.x loaded',
    '  ⚡ Three.js 0.182.0 ready',
    '  ⚡ R3F 9.5.0 ecosystem loaded',
    '  ⚡ PostProcessing 6.38.2 effects ready',
    '',
    '  Development server running at full speed',
    '  GPU acceleration enabled',
    '  React Compiler 1.0.0 optimizing',
    ''
  ];

  useEffect(() => {
    const typeCommands = async () => {
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        setIsTyping(true);
        setCurrentLine('');
        
        const baseSpeed = command.includes('⚡') || command.includes('🚀') || command.includes('🎨') || command.includes('⚛️') ? 8 : 12;
        
        for (let j = 0; j <= command.length; j++) {
          await new Promise(resolve => setTimeout(resolve, baseSpeed + Math.random() * 8));
          setCurrentLine(command.slice(0, j));
        }
        
        setLines(prev => [...prev, command]);
        setCurrentLine('');
        setIsTyping(false);
        
        // Minimal professional delays
        let delay = 80 + Math.random() * 40;
        if (command.includes('Ready in')) delay = 150;
        if (command.includes('⚡')) delay = 50;
        if (command.includes('Portfolio ready')) delay = 200;
        if (command === '') delay = 30;
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
    if (line.includes('▲ Next.js')) return styles.nextjs;
    if (line.includes('Local:')) return styles.local;
    if (line.includes('✓ Ready')) return styles.ready;
    if (line.includes('⚡')) return styles.tech;

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
        <div className={styles.title}>Aryans-MacBook-Pro — aryan — zsh</div>
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