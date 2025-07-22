// 2. 📁 /components/Notifier.jsx
import { useEffect, useState } from 'react';

const Notifier = ({ message, type = 'info', duration = 4000 }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!show) return null;

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div className={`fixed top-20 right-6 px-4 py-2 rounded-xl text-white shadow-lg animate-slideIn ${colors[type]} z-50`}>
      {message}
    </div>
  );
};

export default Notifier;
