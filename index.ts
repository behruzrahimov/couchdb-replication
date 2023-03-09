import Nano from "nano";
const configBob = "http://bob:bob!@192.168.68.107:5984";
const configAlice = "http://alice:alice!@192.168.68.107:5980";
async function CouchDbExample() {
  const nano = Nano(configBob);
  const nano2 = Nano(configAlice);
  async function isDatabaseExist(name: string): Promise<boolean> {
    try {
      await nano.db.get(name);
      return true;
    } catch (e: any) {
      if (e.message === "Database does not exist.") return false;
      throw e;
    }
  }
  async function isDatabaseExist2(name: string): Promise<boolean> {
    try {
      await nano2.db.get(name);
      return true;
    } catch (e: any) {
      if (e.message === "Database does not exist.") return false;
      throw e;
    }
  }
  async function createReplicatorDataBase() {
    const dbName = "_replicator";
    const isExist1 = await isDatabaseExist(dbName);
    if (!isExist1) {
      await nano.db.create(dbName);
    }
    const isExist2 = await isDatabaseExist2(dbName);
    if (!isExist2) {
      await nano2.db.create(dbName);
    }
  }
  async function asyncCall() {
    await createReplicatorDataBase();
    const dbName = "people";
    const isExist = await isDatabaseExist(dbName);
    if (isExist) await nano.db.destroy(dbName);
    await nano.db.create(dbName);
    const db = nano.db.use(dbName);
    interface iPerson extends Nano.MaybeDocument {
      _id: string;
      name: string;
      date: string;
    }
    class Person implements iPerson {
      _id: string;
      name: string;
      date: string;
      constructor(name: string, date: string) {
        this._id = "1";
        this.name = name;
        this.date = date;
      }
      processAPIResponse(response: Nano.DocumentInsertResponse) {
        if (response.ok) {
          this._id = response.id;
        }
      }
    }
    let person = new Person("JON", "2015-02-04");
    db.insert(person).then((response) => {
      person.processAPIResponse(response);
      console.log(person);
    });
    try {
      const isExist = await isReplicationExist({
        source: `${configBob}/${db.config.db}`,
        target: `${configAlice}/${db.config.db}`,
      });
      if (!isExist) {
        const response = await nano.db.replication.enable(
          `${configBob}/${db.config.db}`,
          `${configAlice}/${db.config.db}`,
          {
            create_target: true,
            continuous: false,
          }
        );
        console.log("response", response);
      }
      const isExist2 = await isReplicationExist2({
        source: `${configAlice}/${db.config.db}`,
        target: `${configBob}/${db.config.db}`,
      });
      if (!isExist2) {
        const response2 = await nano2.db.replication.enable(
          `${configAlice}/${db.config.db}`,
          `${configBob}/${db.config.db}`,
          {
            create_target: true,
            continuous: false,
          }
        );
        console.log("response2", response2);
      }
    } catch (err) {
      console.error("REPLICATION", err);
    }
    async function isReplicationExist({
      source,
      target,
    }: {
      source: string;
      target: string;
    }): Promise<boolean> {
      const result = await nano.use("_replicator").find({
        selector: {
          source: source,
          target: target,
        },
      });
      return result.docs.length > 0;
    }
    async function isReplicationExist2({
      source,
      target,
    }: {
      source: string;
      target: string;
    }): Promise<boolean> {
      const result = await nano2.use("_replicator").find({
        selector: {
          source: source,
          target: target,
        },
      });
      return result.docs.length > 0;
    }
  }
  await asyncCall();
}
await CouchDbExample();
