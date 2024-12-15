"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { config } from "@/lib/config";
import { thingsboard } from "@/lib/tbClient";

import axios from "axios";
import { BellIcon, Grab, Heart, Settings2Icon, Thermometer, User2Icon } from "lucide-react";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useWebSocket from "react-use-websocket";
import { TbEntity } from "thingsboard-api-client";
import InputThreshold from "./components/input-threshold";
import LatestTelemetryCard from "./components/latest-telemetry-card";
import TelemetryTable from "./components/telemetry-table";

const { deviceId, tbServer } = config;
const keys = "round_number";
  const startkey = true;
  let active = false;

const formatAttribute = (data: any) => {
  let format = {} as any;
  Object.values(data).map((item: any) => {
    format[item["key"]] = item["value"];
  });
  return format;
};

const DashboardPage = () => {
  const [loading, setLoading] = useState(false);
  const [latestData, setLatestData] = useState() as any;
  const [attribute, setAttribute] = useState({});


  const [socketUrl, setSocketUrl] = useState("");
  const [saveState, setSaveState] = useState(false);
  const [ping, setPing] = useState(false);
  const [edit, setEdit] = useState<{ key: string; value: string | number }>({ key: "", value: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
 
    const socketUrl = `wss://${tbServer}/api/ws/plugins/telemetry?token=${token}`;
    setSocketUrl(socketUrl);
  }, []);
  const { getWebSocket } = useWebSocket(socketUrl != "" ? socketUrl : null, {
    onOpen: () => {
      var object = {
        tsSubCmds: [
          {
            entityType: "DEVICE",
            entityId: deviceId,
            scope: "LATEST_TELEMETRY",
            cmdId: 10,
          },
        ],
        historyCmds: [],
        attrSubCmds: [],
      };
      var data = JSON.stringify(object);
      getWebSocket().send(data);
    },
    onMessage: (event) => {
      let obj = JSON.parse(event.data).data;
      console.log("obj", obj);
      if (obj?.[0]?.entityId === deviceId) {
        setPing(!ping);
      }
    },
    onClose: () => { },
  }) as any;

  useEffect(()=>{
    const token = localStorage.getItem("token");
    if (!token) {
      redirect("/login");
    }
    const url = `https://${tbServer}/api/plugins/telemetry/DEVICE/${deviceId}/values/attributes/SERVER_SCOPE`;
    const headers = {
      "accept": "application/json",
      "X-Authorization": `Bearer ${token}`,
    };
    axios.get(url, { headers })
      .then((res) => {
        const data = res.data;
        const activeItem = data.find((item: { key: string; value: any }) => item.key === 'active');
        if (activeItem) {
          active = activeItem.value;
        }
        console.log({ active });
        
      })
      .catch((error) => {
        console.error({ error });
      })
      .finally(() => { });
  })




const handleStart = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    redirect("/login");
  }
  const url = `https://${tbServer}/api/plugins/telemetry/${deviceId}/SHARED_SCOPE`;
  const headers = {
    "Content-Type": "application/json",
    "X-Authorization": `Bearer ${token}`,
  };
  const data = {
    start: startkey,
  };
  await axios.post(url, data, { headers })
    .then(() => {
      toast.success("Chạy thành công");
      setSaveState(!saveState);
    })
    .catch((error) => {
      console.error({ error });
      toast.error("Có lỗi xảy ra");
    })
    .finally(() => { });
}
  const now = Date.now();
  const handleAttributeChange = (key: string, value: string | number) => {
    setAttribute((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  const onSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      redirect("/login");
    }

    const url = `https://${tbServer}/api/plugins/telemetry/DEVICE/${deviceId}/attributes/SHARED_SCOPE`;
    const headers = {
      "Content-Type": "application/json",
      "X-Authorization": `Bearer ${token}`,
    };

    await axios
      .post(url, attribute, { headers })
      .then(() => {
        toast.success("Lưu ngưỡng thành công");
      })
      .catch((error) => {
        console.error({ error });
        toast.error("Có gì đó sai sai");
      })
      .finally(() => {
        setEdit({ key: "", value: "" });
      });
  };

  

  const [table, setTable] = useState() as any;

  useEffect(() => {
    const html = (
      <TelemetryTable
        entityId={deviceId}
        entityType={TbEntity.DEVICE}
        keys={keys}
        startTs={0}
        endTs={now}
      />
    );
    setTable(html);
  }, [ping]);

  const Maps = dynamic(() => import("./components/maps"), {
    ssr: false,
  });


  return (
    <div className="flex gap-1">
      <div className="w-1/3 flex z-40">
        <LatestTelemetryCard
          className="justify-center"
          title="Vinh Vinh Phat"
          data={latestData?.["round_number"][0]}
          isInteger={true}
          loading={loading}
        
          unit="%"
        >
            <div className="flex flex-col gap-4">
      <InputThreshold
        title="Vòng Thuận"
        targetKey="vong_1"
        setEdit={setEdit}
        edit={edit}
        attribute={attribute}
        onChange={handleAttributeChange}
      />
      <InputThreshold
        title="Vòng Nghịch"
        targetKey="vong_2"
        setEdit={setEdit}
        edit={edit}
        attribute={attribute}
        onChange={handleAttributeChange}
      />
      <Button
        className="mx-auto save-btn w-1/3"
        onClick={onSave}
      >
        Lưu
      </Button>
    </div>
        </LatestTelemetryCard>
      </div>
      <div className=" flex w-1/3">
        <Button className="run-btn w-1/3 h-[100px] mx-auto my-auto rounded-1/3 bg-white text-green text-lg font-bold border-solid border-2 border-green"
          onClick={handleStart}
        >
          Run
        </Button>
      </div>
      <div className="w-1/3 h-[300px] state-device bg-gray-100 rounded-lg flex flex-col justify-center items-center">
       <span className="text-2xl font-bold">State Device</span>
       {active ? ( 
        <div className="w-[200px] h-[200px] rounded-full bg-green-500 text-center flex justify-center items-center">
        </div>
      ) : (
        <div className="w-[200px] h-[200px] rounded-full bg-orange-500 text-center flex justify-center items-center">
        </div>
      )}
      </div>

    </div>
  );
};

export default DashboardPage;
