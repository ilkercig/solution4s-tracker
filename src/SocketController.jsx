import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { useDispatch, useSelector, connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Snackbar } from '@mui/material';
import { devicesActions, sessionActions } from './store';
import { useCatchCallback, useEffectAsync } from './reactHelper';
import { snackBarDurationLongMs } from './common/util/duration';
import alarm from './resources/alarm.mp3';
import { eventsActions } from './store/events';
import useFeatures from './common/util/useFeatures';
import { useAttributePreference } from './common/util/preferences';
import { handleNativeNotificationListeners, nativePostMessage } from './common/components/NativeInterface';
import fetchOrThrow from './common/util/fetchOrThrow';
import apiFetch from './common/util/apiFetch';
import { getSocketUrl } from './common/util/url';

const logoutCode = 4000;

const SocketController = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const authenticated = useSelector((state) => Boolean(state.session.user));
  const includeLogs = useSelector((state) => state.session.includeLogs);

  useEffect(() => {
    console.log('📡 SocketController mounted. Authenticated:', authenticated);
  }, []);

  const socketRef = useRef();

  const [notifications, setNotifications] = useState([]);

  const soundEvents = useAttributePreference('soundEvents', '');
  const soundAlarms = useAttributePreference('soundAlarms', 'sos');

  const features = useFeatures();

  const handleEvents = useCallback((events) => {
    if (!features.disableEvents) {
      dispatch(eventsActions.add(events));
    }
    if (events.some((e) => soundEvents.includes(e.type)
        || (e.type === 'alarm' && soundAlarms.includes(e.attributes.alarm)))) {
      new Audio(alarm).play();
    }
    setNotifications(events.map((event) => ({
      id: event.id,
      message: event.attributes.message,
      show: true,
    })));
  }, [features, dispatch, soundEvents, soundAlarms]);

  const connectSocket = () => {
    const socketUrl = getSocketUrl();
    
    // Log connection attempt with detailed info
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔌 WebSocket Connection Attempt');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 Environment:', import.meta.env.DEV ? 'Development' : 'Production');
    console.log('🌐 Target URL:', socketUrl);
    console.log('🏠 Current Origin:', window.location.origin);
    console.log('🔐 Same Origin:', socketUrl.includes(window.location.host) ? 'YES (cookies will be sent)' : 'NO (cookies may not be sent)');
    console.log('🍪 Cookies available:', document.cookie || '(no cookies accessible via JS - may be HttpOnly)');
    console.log('👤 Authenticated User:', authenticated ? 'YES' : 'NO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('✅ WebSocket CONNECTED successfully!');
      console.log('   └─ URL:', socketUrl);
      console.log('   └─ ReadyState:', socket.readyState, '(OPEN)');
      console.log('   └─ Protocol:', socket.protocol || '(none)');
      console.log('   └─ Extensions:', socket.extensions || '(none)');
      dispatch(sessionActions.updateSocket(true));
    };

    socket.onclose = async (event) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔌 WebSocket CLOSED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 Close Code:', event.code);
      console.log('📝 Close Reason:', event.reason || '(no reason provided)');
      console.log('🧹 Was Clean:', event.wasClean ? 'YES' : 'NO');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Common WebSocket close codes explanation
      const closeCodeExplanations = {
        1000: 'Normal closure',
        1001: 'Going away (e.g., browser navigating away)',
        1002: 'Protocol error',
        1003: 'Unsupported data type',
        1006: 'Abnormal closure (no close frame, connection lost)',
        1007: 'Invalid frame payload data',
        1008: 'Policy violation',
        1009: 'Message too big',
        1011: 'Server error',
        1015: 'TLS handshake failure',
        4000: 'Logout (app-specific)',
      };
      
      if (closeCodeExplanations[event.code]) {
        console.log('💡 Explanation:', closeCodeExplanations[event.code]);
      }
      
      dispatch(sessionActions.updateSocket(false));
      if (event.code !== logoutCode) {
        try {
          const devicesResponse = await apiFetch('/api/devices');
          if (devicesResponse.ok) {
            dispatch(devicesActions.update(await devicesResponse.json()));
          }
          const positionsResponse = await apiFetch('/api/positions');
          if (positionsResponse.ok) {
            dispatch(sessionActions.updatePositions(await positionsResponse.json()));
          }
          if (devicesResponse.status === 401 || positionsResponse.status === 401) {
            navigate('/login');
          }
        } catch {
          // ignore errors
        }
        console.log('WebSocket will reconnect in 60 seconds...');
        setTimeout(connectSocket, 60000);
      }
    };

    socket.onerror = (error) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ WebSocket ERROR');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error event:', error);
      console.log('📊 ReadyState:', socket.readyState);
      const states = ['CONNECTING (0)', 'OPEN (1)', 'CLOSING (2)', 'CLOSED (3)'];
      console.log('   └─ State:', states[socket.readyState] || socket.readyState);
      console.log('🌐 URL attempted:', socketUrl);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('🔍 Common causes:');
      console.log('   1. Server not accepting WebSocket connections');
      console.log('   2. Authentication/session cookie not being sent');
      console.log('   3. CORS policy blocking the connection');
      console.log('   4. Server requires authentication but none provided');
      console.log('   5. Network/firewall blocking WebSocket connections');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.devices) {
        dispatch(devicesActions.update(data.devices));
      }
      if (data.positions) {
        dispatch(sessionActions.updatePositions(data.positions));
      }
      if (data.events) {
        handleEvents(data.events);
      }
      if (data.logs) {
        dispatch(sessionActions.updateLogs(data.logs));
      }
    };
  };

  useEffect(() => {
    socketRef.current?.send(JSON.stringify({ logs: includeLogs }));
  }, [includeLogs]);

  useEffectAsync(async () => {
    if (authenticated) {
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔐 User authenticated, initializing...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      try {
        console.log('📡 Fetching initial device data from /api/devices...');
        const response = await fetchOrThrow('/api/devices');
        const devices = await response.json();
        console.log('✅ Device data received:', devices.length, 'devices');
        dispatch(devicesActions.refresh(devices));
        
        console.log('');
        console.log('🔌 Now initiating WebSocket connection...');
        nativePostMessage('authenticated');
        connectSocket();
      } catch (error) {
        console.error('❌ Failed to fetch initial data:', error);
        console.log('⚠️  WebSocket connection may still be attempted...');
        connectSocket();
      }
      
      return () => {
        console.log('🔌 Closing WebSocket connection (logout)...');
        socketRef.current?.close(logoutCode);
      };
    }
    return null;
  }, [authenticated]);

  const handleNativeNotification = useCatchCallback(async (message) => {
    const eventId = message.data.eventId;
    if (eventId) {
      const response = await apiFetch(`/api/events/${eventId}`);
      if (response.ok) {
        const event = await response.json();
        const eventWithMessage = {
          ...event,
          attributes: { ...event.attributes, message: message.notification.body },
        };
        handleEvents([eventWithMessage]);
      }
    }
  }, [handleEvents]);

  useEffect(() => {
    handleNativeNotificationListeners.add(handleNativeNotification);
    return () => handleNativeNotificationListeners.delete(handleNativeNotification);
  }, [handleNativeNotification]);

  useEffect(() => {
    if (!authenticated) return;
    const reconnectIfNeeded = () => {
      const socket = socketRef.current;
      if (!socket || socket.readyState === WebSocket.CLOSED) {
        connectSocket();
      } else if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send('{}');
        } catch {
          // test connection
        }
      }
    };
    const onVisibility = () => {
      if (!document.hidden) {
        reconnectIfNeeded();
      }
    };
    window.addEventListener('online', reconnectIfNeeded);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('online', reconnectIfNeeded);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [authenticated]);

  return (
    <>
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={notification.show}
          message={notification.message}
          autoHideDuration={snackBarDurationLongMs}
          onClose={() => setNotifications(notifications.filter((e) => e.id !== notification.id))}
        />
      ))}
    </>
  );
};

export default connect()(SocketController);
