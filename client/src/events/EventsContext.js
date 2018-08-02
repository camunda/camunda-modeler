import React from 'react';

import EventBus from 'diagram-js/lib/core/EventBus';

const EventsContext = React.createContext(new EventBus());

export default EventsContext;