import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

// Neo4j Aura connection
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

// Verify connection
export async function verifyConnection() {
  const session = driver.session();
  try {
    await session.run('RETURN 1');
    console.log('✅ Connected to Neo4j Aura');
    return true;
  } catch (error) {
    console.error('❌ Neo4j connection failed:', error.message);
    return false;
  } finally {
    await session.close();
  }
}

// Run a Cypher query
export async function runQuery(cypher, params = {}) {
  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
}

// Run a write transaction
export async function runWrite(cypher, params = {}) {
  const session = driver.session();
  try {
    const result = await session.executeWrite(tx => tx.run(cypher, params));
    return result;
  } finally {
    await session.close();
  }
}

// Close driver on shutdown
export async function closeDriver() {
  await driver.close();
}

export default driver;
