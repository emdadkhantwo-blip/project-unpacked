import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  MessageSquare,
  AlertTriangle,
  Award,
  TrendingUp,
  Users,
  Trash2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePerformance, PerformanceNoteType } from '@/hooks/usePerformance';
import { AddPerformanceNoteDialog } from '@/components/hr/AddPerformanceNoteDialog';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const NOTE_TYPES: Array<{
  id: PerformanceNoteType;
  name: string;
  icon: typeof MessageSquare;
  color: string;
  bg: string;
}> = [
  { id: 'feedback', name: 'Feedback', icon: MessageSquare, color: 'text-vibrant-blue', bg: 'bg-vibrant-blue/10' },
  { id: 'warning', name: 'Warning', icon: AlertTriangle, color: 'text-vibrant-amber', bg: 'bg-vibrant-amber/10' },
  { id: 'reward', name: 'Reward', icon: Award, color: 'text-vibrant-green', bg: 'bg-vibrant-green/10' },
  { id: 'kpi', name: 'KPI Review', icon: TrendingUp, color: 'text-vibrant-purple', bg: 'bg-vibrant-purple/10' },
];

const HRPerformance = () => {
  const [activeTab, setActiveTab] = useState('all');
  const { notes, stats, staffPerformance, staffList, isLoading, addNote, deleteNote } = usePerformance();

  const filteredNotes = activeTab === 'all' 
    ? notes 
    : notes.filter(n => n.note_type === activeTab);

  const getNoteTypeInfo = (type: PerformanceNoteType) => {
    return NOTE_TYPES.find(t => t.id === type) || NOTE_TYPES[0];
  };

  const renderStars = (rating: number | null) => {
    if (rating === null) return null;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating
                ? 'fill-vibrant-amber text-vibrant-amber'
                : 'text-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-vibrant-blue/10 to-vibrant-cyan/10 border-l-4 border-l-vibrant-blue">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Notes</p>
                <p className="text-2xl font-bold">{isLoading ? '-' : stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-vibrant-blue" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-amber/10 to-vibrant-orange/10 border-l-4 border-l-vibrant-amber">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold">{isLoading ? '-' : stats.warnings}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-vibrant-amber" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-green/10 to-vibrant-emerald/10 border-l-4 border-l-vibrant-green">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rewards</p>
                <p className="text-2xl font-bold">{isLoading ? '-' : stats.rewards}</p>
              </div>
              <Award className="h-8 w-8 text-vibrant-green" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-purple/10 to-vibrant-indigo/10 border-l-4 border-l-vibrant-purple">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Rating</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '-' : stats.averageRating ? stats.averageRating.toFixed(1) : '-'}
                </p>
              </div>
              <Star className="h-8 w-8 text-vibrant-purple" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff List with Ratings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-vibrant-blue" />
              Staff Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : staffPerformance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No performance data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {staffPerformance.map((staff) => (
                  <div 
                    key={staff.profile_id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={staff.avatar || undefined} />
                        <AvatarFallback>
                          {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{staff.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{staff.total_notes} notes</span>
                          {staff.warnings > 0 && (
                            <Badge variant="outline" className="h-4 px-1 text-[10px] border-vibrant-amber text-vibrant-amber">
                              {staff.warnings}⚠
                            </Badge>
                          )}
                          {staff.rewards > 0 && (
                            <Badge variant="outline" className="h-4 px-1 text-[10px] border-vibrant-green text-vibrant-green">
                              {staff.rewards}🏆
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {staff.average_rating !== null ? (
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-sm">{staff.average_rating.toFixed(1)}</span>
                          <Star className="h-3 w-3 fill-vibrant-amber text-vibrant-amber" />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No rating</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Notes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-vibrant-amber" />
                Performance Notes
              </CardTitle>
              <AddPerformanceNoteDialog
                staffList={staffList}
                onSubmit={(data) => addNote.mutate(data)}
                isSubmitting={addNote.isPending}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                {NOTE_TYPES.map((type) => (
                  <TabsTrigger key={type.id} value={type.id}>
                    {type.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={activeTab}>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : filteredNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Star className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">No performance notes</h3>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Add performance notes to track employee progress and feedback.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredNotes.map((note) => {
                      const typeInfo = getNoteTypeInfo(note.note_type);
                      const Icon = typeInfo.icon;
                      return (
                        <div 
                          key={note.id}
                          className="p-4 rounded-lg border"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={note.staff_avatar || undefined} />
                                <AvatarFallback>
                                  {note.staff_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">{note.staff_name}</span>
                                  <Badge variant="outline" className={`${typeInfo.bg} ${typeInfo.color} border-0`}>
                                    <Icon className="h-3 w-3 mr-1" />
                                    {typeInfo.name}
                                  </Badge>
                                  {note.rating && renderStars(note.rating)}
                                </div>
                                <p className="text-sm mt-2">{note.content}</p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  <span>by {note.author_name}</span>
                                  <span>•</span>
                                  <span>{format(parseISO(note.created_at), 'MMM d, yyyy')}</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteNote.mutate(note.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Note Type Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Note Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {NOTE_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.id} className={`flex items-center gap-3 p-3 rounded-lg ${type.bg}`}>
                  <Icon className={`h-5 w-5 ${type.color}`} />
                  <div>
                    <p className="font-medium text-sm">{type.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRPerformance;
