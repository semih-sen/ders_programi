"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import type { EventContentArg } from "@fullcalendar/core";
import EventModal from "./EventModal";
import type { GoogleCalendarEvent } from "@/lib/googleCalendarHelper";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

interface ModernCalendarProps {
  events: GoogleCalendarEvent[];
}

export default function ModernCalendar({ events }: ModernCalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const renderEventContent = (eventInfo: EventContentArg) => {
    const startTime = eventInfo.event.start
      ? new Date(eventInfo.event.start).toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
    
    return (
      <div className="fc-event-custom group">
        <div className="flex items-center gap-1.5 px-2 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate">{eventInfo.event.title}</div>
            <div className="text-[10px] opacity-75">{startTime}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="modern-calendar-wrapper">
      <style jsx global>{`
        .modern-calendar-wrapper {
          --fc-border-color: rgba(51, 65, 85, 0.3);
          --fc-button-bg-color: #1e293b;
          --fc-button-border-color: #334155;
          --fc-button-hover-bg-color: #334155;
          --fc-button-active-bg-color: #475569;
          --fc-today-bg-color: rgba(99, 102, 241, 0.05);
        }
        
        .modern-calendar-wrapper .fc {
          background: transparent;
        }
        
        .modern-calendar-wrapper .fc-toolbar-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
        }
        
        .modern-calendar-wrapper .fc-button {
          border-radius: 0.5rem;
          padding: 0.5rem 1rem;
          font-weight: 600;
          font-size: 0.875rem;
          text-transform: capitalize;
          transition: all 0.2s;
        }
        
        .modern-calendar-wrapper .fc-button:hover {
          transform: translateY(-1px);
        }
        
        .modern-calendar-wrapper .fc-daygrid-day {
          transition: background 0.2s;
        }
        
        .modern-calendar-wrapper .fc-daygrid-day:hover {
          background: rgba(99, 102, 241, 0.03);
        }
        
        .modern-calendar-wrapper .fc-col-header-cell {
          background: rgba(15, 23, 42, 0.5);
          color: #94a3b8;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          padding: 0.75rem 0.5rem;
          border: none;
        }
        
        .modern-calendar-wrapper .fc-daygrid-day-number {
          color: #e2e8f0;
          padding: 0.5rem;
          font-weight: 600;
        }
        
        .modern-calendar-wrapper .fc-event {
          border: none;
          border-radius: 0.5rem;
          padding: 0;
          margin: 2px 4px;
          transition: all 0.2s;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        
        .modern-calendar-wrapper .fc-event:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .modern-calendar-wrapper .fc-event-custom {
          color: white;
        }
        
        .modern-calendar-wrapper .fc-daygrid-event {
          white-space: normal;
        }
        
        .modern-calendar-wrapper .fc-scrollgrid {
          border-color: var(--fc-border-color);
          border-radius: 1rem;
          overflow: hidden;
        }
        
        .modern-calendar-wrapper .fc-scrollgrid td,
        .modern-calendar-wrapper .fc-scrollgrid th {
          border-color: var(--fc-border-color);
        }
      `}</style>
      
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        height="auto"
        events={events}
        eventContent={renderEventContent}
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
        slotMinTime="08:00:00"
        slotMaxTime="18:00:00"
        allDaySlot={false}
        locale="tr"
      />

      <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
