import React from "react";
import merchants from "../data/all_agents_metadata.json";

const MerchantAgentPage: React.FC = () => {
  return (
    <div>
      <h1>Merchant Agents</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Description</th>
            <th>Image</th>
          </tr>
        </thead>
        <tbody>
          {merchants.map((merchant) => (
            <tr key={merchant.id}>
              <td>{merchant.id}</td>
              <td>{merchant.metadata.name}</td>
              <td>{merchant.metadata.description}</td>
              <td>
                <img src={merchant.metadata.image} alt={merchant.metadata.name} width="50" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MerchantAgentPage;
