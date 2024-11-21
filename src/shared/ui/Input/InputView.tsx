import React from 'react';

import styles from './Input.module.scss';

interface IInputProps {
  // Определите пропсы здесь
}

export function InputView({}: IInputProps) {
  return (
    <div className={styles.input}>
      <h2>Input</h2>
      {/* Добавьте содержимое компонента здесь */}
    </div>
  );
}
