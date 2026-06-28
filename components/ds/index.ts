// Scarsian Design System — public API
// Import from '@/components/ds' in all page components

// Foundations (re-export primitives upgraded to DS tokens)
export { Button }           from '@/components/ui/button'
export { Badge }            from '@/components/ui/badge'
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
export { Input }            from '@/components/ui/input'
export { Modal }            from '@/components/ui/modal'
export { Progress }         from '@/components/ui/progress'
export { Select }           from '@/components/ui/select'
export { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown'
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table'

// DS Components
export { SearchInput }      from './SearchInput'
export { SectionHeader }    from './SectionHeader'
export { MetricCard }       from './MetricCard'
export { IndexCard }        from './IndexCard'
export { ConfidenceBadge }  from './ConfidenceBadge'
export { SourceBadge }      from './SourceBadge'
export { EvidenceCard }     from './EvidenceCard'
export { Timeline }         from './Timeline'
export { EmptyState }       from './EmptyState'
export { LoadingSteps }     from './LoadingSteps'
export { StatCard }         from './StatCard'
export { HeroBanner }       from './HeroBanner'

// Layout
export {
  PageContainer,
  ContentContainer,
  TwoColumnLayout,
  DetailLayout,
  SidebarLayout,
} from './layout'

// Types
export type { SourceTier }  from './SourceBadge'
export type { TimelineItem } from './Timeline'
export type { LoadingStep } from './LoadingSteps'
export type { ButtonVariant, ButtonSize, ButtonProps } from '@/components/ui/button'
export type { BadgeVariant } from '@/components/ui/badge'
export type { CardPadding }  from '@/components/ui/card'
export type { ProgressColor } from '@/components/ui/progress'
