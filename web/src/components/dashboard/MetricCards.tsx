import React from 'react';
import { useHome } from '../../context/HomeContext';

/**
 * Dòng trạng thái mảnh. Trước đây là 4 thẻ lớn có icon gradient và quầng sáng,
 * đẩy công tắc — thứ người ta mở app để bấm — xuống dưới màn hình đầu.
 * Đây là số liệu tham khảo, không phải thao tác, nên nó chỉ cần một dòng.
 */
export const MetricCards: React.FC = () => {
  const { devices, rooms, members } = useHome();

  const onlineDevices = devices.filter((d) => d.status === 'online').length;

  let totalRelays = 0;
  let activeRelays = 0;
  devices.forEach((d) => {
    d.relay_channels?.forEach((ch) => {
      totalRelays++;
      if (ch.state) activeRelays++;
    });
  });

  const parts = [
    `${onlineDevices}/${devices.length} thiết bị trực tuyến`,
    `${activeRelays}/${totalRelays} công tắc đang bật`,
    `${rooms.length} phòng`,
    `${members.length} thành viên`,
  ];

  return (
    <p className="text-sm text-ink-2 tnum">
      {parts.map((part, i) => (
        <React.Fragment key={part}>
          {i > 0 && <span aria-hidden="true" className="mx-2 text-line">·</span>}
          {part}
        </React.Fragment>
      ))}
    </p>
  );
};
