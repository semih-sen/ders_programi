"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import EventModal from "./EventModal";

// FullCalendar must be dynamically imported in Next.js client components
const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

// Placeholder events: In real use, fetch from API or props
const sampleEvents = [
  {
    id: "1",
    title: "Anatomi - Amfi 4",
    start: new Date().toISOString(),
    end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    extendedProps: { place: "Amfi 4", lecturer: "Dr. Çelik" },
  },
  {
    id: "2",
    title: "Yemek Molası",
    start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    end: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    extendedProps: { place: "Yemekhane", lecturer: undefined },
  },
];

export default function DashboardCalendar() {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const events = useMemo(() => sampleEvents, []);

  return (
    <div className="bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        height="auto"
        selectable={true}
        events={events}
        eventClick={(info) => {
          setSelectedEvent({
            id: info.event.id,
            title: info.event.title,
            start: info.event.start,
            end: info.event.end,
            extendedProps: info.event.extendedProps,
          });
        }}
        dayMaxEventRows={3}
        weekends={true}
        nowIndicator={true}
        themeSystem="standard"
      />

      <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
