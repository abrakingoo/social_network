'use client';

import React, { createContext, useContext, useState } from 'react';

const GroupContext = createContext();

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) {
    return { groupData: null, setGroupData: () => {} };
  }
  return context;
};

export const GroupProvider = ({ children }) => {
  const [groupData, setGroupData] = useState(null);

  return (
    <GroupContext.Provider value={{ groupData, setGroupData }}>
      {children}
    </GroupContext.Provider>
  );
};