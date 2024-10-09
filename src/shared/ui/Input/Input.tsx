import React from 'react';
import styles from './Input.module.scss';
import { useInput } from './useInput';

interface InputProps {
  // Определите пропсы здесь
}

export function Input({}: InputProps) {
  const { state } = useInput();

  return (
    <div className={styles.input}>
      <h1>Input</h1>
      {/* Используйте state из хука здесь */}
    </div>
  );
}
