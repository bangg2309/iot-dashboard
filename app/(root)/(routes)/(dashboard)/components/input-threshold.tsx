import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit } from "lucide-react";

interface InputThresholdProps {
  title: string;
  targetKey: string;
  setEdit: (edit: { key: string; value: string | number }) => void;
  edit: { key: string; value: string | number };
  attribute: Record<string, any>;
  onChange: (key: string, value: string | number) => void;
}

const InputThreshold: React.FC<InputThresholdProps> = ({
  title,
  targetKey,
  setEdit,
  edit,
  attribute,
  onChange,
}) => {
  const [localValue, setLocalValue] = useState<string | number | undefined>(
    attribute?.[targetKey]
  );

  // Khi giá trị `attribute` thay đổi, đồng bộ lại giá trị `localValue`
  useEffect(() => {
    setLocalValue(attribute?.[targetKey]);
  }, [attribute, targetKey]);

  return (
    <div className="flex justify-start items-center gap-4">
      {title}:{" "}
      <Input
        value={localValue || ""}
        className="w-[200px] rounded-full ms-2"
        type="number"
        onChange={(e) => {
          const value = e.target.value;
          setLocalValue(value); // Cập nhật giá trị cục bộ
          onChange(targetKey, value); // Gửi giá trị thay đổi về parent
        }}
      />
      <Button
        variant={"ghost"}
        size={"sm"}
        className="rounded-full"
        style={{ zIndex: 99 }}
        onClick={() => {
          // Cho phép chỉnh sửa khi người dùng click Edit
          setEdit({
            key: targetKey,
            value: localValue ?? "",
          });
        }}
      >
        <Edit className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default InputThreshold;
