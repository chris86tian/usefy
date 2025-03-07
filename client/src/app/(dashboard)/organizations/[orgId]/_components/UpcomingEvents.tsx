import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, Clock } from 'lucide-react';

const UpcomingEvents = () => {
    const upcomingEvents = [
        {
          id: 1,
          title: "React Workshop",
          date: "March 5, 2025",
          time: "10:00 AM - 12:00 PM",
          participants: 12
        },
        {
          id: 2,
          title: "TypeScript Code Review",
          date: "March 8, 2025",
          time: "2:00 PM - 3:30 PM",
          participants: 8
        },
        {
          id: 3, 
          title: "New Course Planning",
          date: "March 15, 2025",
          time: "11:00 AM - 1:00 PM",
          participants: 5
        }
      ]
    return (
        <Card>
            <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Events and deadlines for your courses</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
                {upcomingEvents.slice(0, 2).map((event) => (
                <div key={event.id} className="flex items-start gap-4">
                    <div className="rounded-md bg-primary/10 p-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                    <p className="font-medium">{event.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                        {event.date} • {event.time}
                        </span>
                    </div>
                    </div>
                    <Button size="sm" variant="outline">
                    RSVP
                    </Button>
                </div>
                ))}
            </div>
            </CardContent>
        </Card>
    );
}

export default UpcomingEvents;