import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NeuroStrip } from './NeuroStrip';
import type { NeuroLevels } from '../lib/types';

describe('NeuroStrip', () => {
  const createLevels = (overrides: Partial<NeuroLevels> = {}): NeuroLevels => ({
    noradrenaline: 'MEDIUM',
    acetylcholine: 'MEDIUM',
    serotonin: 'MEDIUM',
    dopamine: 'MEDIUM',
    ...overrides,
  });

  it('renders all four neuromodulator abbreviations', () => {
    const levels = createLevels();
    render(<NeuroStrip levels={levels} />);

    expect(screen.getByText('NOR')).toBeInTheDocument();
    expect(screen.getByText('ACH')).toBeInTheDocument();
    expect(screen.getByText('SER')).toBeInTheDocument();
    expect(screen.getByText('DOP')).toBeInTheDocument();
  });

  it('shows level text for each neuromodulator', () => {
    const levels = createLevels({
      noradrenaline: 'HIGH',
      acetylcholine: 'LOW',
      serotonin: 'MEDIUM',
      dopamine: 'HIGH',
    });
    render(<NeuroStrip levels={levels} />);

    const levelTexts = screen.getAllByText('HIGH');
    expect(levelTexts).toHaveLength(2); // noradrenaline and dopamine

    expect(screen.getByText('LOW')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('renders progress bars with role="progressbar"', () => {
    const levels = createLevels();
    const { container } = render(<NeuroStrip levels={levels} />);

    const progressBars = container.querySelectorAll('[role="progressbar"]');
    expect(progressBars).toHaveLength(4);
  });

  it('renders LOW level with 25% width', () => {
    const levels = createLevels({ noradrenaline: 'LOW' });
    const { container } = render(<NeuroStrip levels={levels} />);

    const progressBars = container.querySelectorAll('[role="progressbar"]');
    const norBar = progressBars[0]; // First is noradrenaline
    expect(norBar).toHaveStyle({ width: '25%' });
  });

  it('renders MEDIUM level with 55% width', () => {
    const levels = createLevels({ acetylcholine: 'MEDIUM' });
    const { container } = render(<NeuroStrip levels={levels} />);

    const progressBars = container.querySelectorAll('[role="progressbar"]');
    const achBar = progressBars[1]; // Second is acetylcholine
    expect(achBar).toHaveStyle({ width: '55%' });
  });

  it('renders HIGH level with 90% width', () => {
    const levels = createLevels({ serotonin: 'HIGH' });
    const { container } = render(<NeuroStrip levels={levels} />);

    const progressBars = container.querySelectorAll('[role="progressbar"]');
    const serBar = progressBars[2]; // Third is serotonin
    expect(serBar).toHaveStyle({ width: '90%' });
  });

  it('applies green color to LOW levels', () => {
    const levels = createLevels({ dopamine: 'LOW' });
    const { container } = render(<NeuroStrip levels={levels} />);

    const progressBars = container.querySelectorAll('[role="progressbar"]');
    const dopBar = progressBars[3]; // Fourth is dopamine
    expect(dopBar).toHaveStyle({ backgroundColor: '#22c55e' });
  });

  it('applies yellow color to MEDIUM levels', () => {
    const levels = createLevels({ noradrenaline: 'MEDIUM' });
    const { container } = render(<NeuroStrip levels={levels} />);

    const progressBars = container.querySelectorAll('[role="progressbar"]');
    const norBar = progressBars[0];
    expect(norBar).toHaveStyle({ backgroundColor: '#eab308' });
  });

  it('applies red color to HIGH levels', () => {
    const levels = createLevels({ acetylcholine: 'HIGH' });
    const { container } = render(<NeuroStrip levels={levels} />);

    const progressBars = container.querySelectorAll('[role="progressbar"]');
    const achBar = progressBars[1];
    expect(achBar).toHaveStyle({ backgroundColor: '#ef4444' });
  });
});
