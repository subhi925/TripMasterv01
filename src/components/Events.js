import React, { useEffect, useState } from 'react';
import Myplan from './Myplan';
import './Events.css'; 

const Events = ({ eventsLst,places, spendDays, dailyHours, arrive, startloc,setPlaces ,titlePlan,shuffleArray,calculateDistance}) => {
    const [selectedEvents, setSelectedEvents] = useState([]);
    const [didSelect,setDidSelect] = useState(false);

    const toggleEvent = (event) => {
        if (!selectedEvents.some((evt)=>(evt.id === event.id))){
            setSelectedEvents([...selectedEvents,event]);
        }
        else{
            let tmp = selectedEvents.filter((item)=>item.id!==event.id);
            setSelectedEvents(tmp);
        }
    };
    return (
        <>
            {!didSelect ?(<div>
                <span className='titlespan'>Choose your Event And Buy Ticket:</span>
                <div className="myContainer">
                    {eventsLst.map((event,idx)=>(
                        <div key={idx} className='box card' onClick={()=>toggleEvent(event)} style={{ filter: selectedEvents.includes(event)?'contrast(50%)':'none'}}>
                            <img src={event.image} alt={event.name} className="event-img"/>
                            <h6>Event: {event.name}</h6>
                            <h6>Place Name: {event.placeName}</h6>
                            <h6>{event.date}</h6>
                            <h6>{event.startTimelocal}</h6>
                            <p>{event.city},{event.country}</p>
                            <a className='lnkTicket' href={event.ticket} target="_blank" rel="noopener noreferrer">
                                Buy Ticket
                            </a>
                        </div>
                    ))}
                </div>
                <button onClick={()=>setDidSelect(true)} >Done Next Step </button>
            </div>
			)
            :
            (
            <div>
                     <Myplan
                            places={places}
                            spendDays={spendDays}
                            eventsList={selectedEvents}
                            setPlaces={setPlaces}
                            arrive={arrive}
                            dailyHours={dailyHours}
                            startloc = {startloc}
                            titlePlan={titlePlan}
                            shuffleArray={shuffleArray}
                            calculateDistance={calculateDistance}
                          />
            </div>

            )}
    </>
    );
};
export default Events;
