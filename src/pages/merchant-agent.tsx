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
            <th>Capabilities</th>
            <th>Attributes</th>
            <th>Supported Trust</th>
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
              <td>
                <ul>
                  {merchant.metadata.capabilities.map((capability) => (
                    <li key={capability}>{capability}</li>
                  ))}
                </ul>
              </td>
              <td>
                <ul>
                  {merchant.metadata.attributes.map((attribute) => (
                    <li key={attribute.trait_type}>
                      {attribute.trait_type}: {attribute.value}
                    </li>
                  ))}
                </ul>
              </td>
              <td>
                <ul>
                  {merchant.metadata.supportedTrust.map((trust) => (
                    <li key={trust}>{trust}</li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MerchantAgentPage;

