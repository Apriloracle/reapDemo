import React, { useState } from 'react';
import { invoke } from '../lib/mcp-engine';

const MCPDemo: React.FC = () => {
  const [output, setOutput] = useState('');

  const handleAddReward = async () => {
    await invoke('addReward', { id: Date.now(), amount: 10 });
    setOutput('✅ Reward added!');
  };

  const handleGetRewards = async () => {
    const rewards = await invoke('getLocalRewards');
    setOutput(JSON.stringify(rewards, null, 2));
  };

  const handleGetUserProfile = async () => {
    const profile = await invoke('getRow_userProfileStore', { tableId: 'profiles', rowId: 'current' });
    setOutput(JSON.stringify(profile, null, 2));
  };

  const handleListTools = async () => {
    const tools = await invoke('listTools');
    setOutput(JSON.stringify(tools, null, 2));
  };

  return (
    <div>
      <h1>⚙️ Pure JS In-Browser MCP Server</h1>
      <button onClick={handleAddReward}>Add Reward</button>
      <button onClick={handleGetRewards}>Get Rewards</button>
      <button onClick={handleGetUserProfile}>Get User Profile</button>
      <button onClick={handleListTools}>List Tools</button>
      <pre>{output}</pre>
    </div>
  );
};

export default MCPDemo;

