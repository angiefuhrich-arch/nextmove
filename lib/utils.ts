import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Verdict } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getVerdictLabel(verdict: Verdict): string {
  const labels: Record<Verdict, string> = {
    strong: 'Strong Move',
    caution: 'Think Twice',
    'no-go': 'No-Go',
  }
  return labels[verdict]
}

export function getVerdictColor(verdict: Verdict): string {
  const colors: Record<Verdict, string> = {
    strong: 'text-green-600',
    caution: 'text-yellow-600',
    'no-go': 'text-red-600',
  }
  return colors[verdict]
}

export function getVerdictBg(verdict: Verdict): string {
  const colors: Record<Verdict, string> = {
    strong: 'bg-green-50 border-green-200',
    caution: 'bg-yellow-50 border-yellow-200',
    'no-go': 'bg-red-50 border-red-200',
  }
  return colors[verdict]
}

export function getScoreStatus(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 70) return 'green'
  if (score >= 45) return 'yellow'
  return 'red'
}

export function getScoreColor(status: 'green' | 'yellow' | 'red'): string {
  const colors = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
  }
  return colors[status]
}

export function getScoreBg(status: 'green' | 'yellow' | 'red'): string {
  const colors = {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
  }
  return colors[status]
}
