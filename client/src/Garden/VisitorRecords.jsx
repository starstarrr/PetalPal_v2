function VisitorRecords({ records = [] }) {
    const safeRecords = Array.isArray(records)
      ? records
      : [];
  
    function formatRecordTime(timeValue) {
      if (!timeValue) {
        return "";
      }
  
      const date = new Date(timeValue);
  
      if (Number.isNaN(date.getTime())) {
        return String(timeValue);
      }
  
      return date.toLocaleString();
    }
  
    function getVisitorName(record) {
      return (
        record?.visitorName ||
        record?.name ||
        record?.senderName ||
        record?.author ||
        "A visitor"
      );
    }
  
    function getVisitorAvatar(record) {
      return (
        record?.visitorAvatar ||
        record?.avatar ||
        record?.senderAvatar ||
        "🦋"
      );
    }
  
    function getAction(record) {
      return String(
        record?.action ||
        record?.type ||
        ""
      ).toLowerCase();
    }
  
    function extractMessage(record) {
      if (record?.message) {
        return record.message;
      }
  
      if (record?.messageText) {
        return record.messageText;
      }
  
      const rawText = String(
        record?.text || ""
      );
  
      const messageMatch = rawText.match(
        /message\s*:\s*(.+)$/i
      );
  
      return messageMatch
        ? messageMatch[1].trim()
        : "";
    }
  
    function getRecordText(record) {
      const visitorName =
        getVisitorName(record);
  
      const action =
        getAction(record);
  
      const rawText = String(
        record?.text || ""
      ).toLowerCase();
  
      const isSupport =
        action.includes("support") ||
        rawText.includes("gave support");
  
      if (isSupport) {
        const supportAmount =
          Number(
            record?.supportAmount ||
            record?.count ||
            record?.amount ||
            1
          ) || 1;
  
        return `${visitorName} gave you support ×${supportAmount}`;
      }
  
      const isMessage =
        action.includes("message") ||
        rawText.includes("message:");
  
      if (isMessage) {
        const message =
          extractMessage(record);
  
        return message
          ? `${visitorName} left a message: ${message}`
          : `${visitorName} left you a message`;
      }
  
      const isLeaving =
        action.includes("left") ||
        rawText.includes("left your garden");
  
      if (isLeaving) {
        return `${visitorName} left your garden`;
      }
  
      const isVisiting =
        action.includes("visit") ||
        action.includes("started") ||
        rawText.includes(
          "started visiting"
        );
  
      if (isVisiting) {
        return `${visitorName} started visiting your garden`;
      }
  
      return (
        record?.text ||
        `${visitorName} interacted with your garden`
      );
    }
  
    return (
      <section
        id="visitRecordsSection"
        className="below-garden-card visitor-records-panel"
      >
        <h2>Visitor Records</h2>
  
        <div id="visitRecords">
          {safeRecords.length === 0 ? (
            <p className="empty-visit-records">
              No visitor activity yet.
            </p>
          ) : (
            safeRecords.map(
              (record, index) => {
                const recordId =
                  record?.id ||
                  record?.recordId ||
                  `${
                    record?.time ||
                    record?.createdAt ||
                    "record"
                  }-${index}`;
  
                const recordTime =
                  record?.time ||
                  record?.createdAt ||
                  record?.timestamp;
  
                return (
                  <article
                    key={recordId}
                    className="visit-record-item"
                  >
                    <div className="visit-record-avatar">
                      {getVisitorAvatar(
                        record
                      )}
                    </div>
  
                    <div className="visit-record-content">
                      <p className="visit-record-text">
                        {getRecordText(
                          record
                        )}
                      </p>
  
                      {recordTime && (
                        <p className="visit-record-time">
                          {formatRecordTime(
                            recordTime
                          )}
                        </p>
                      )}
                    </div>
                  </article>
                );
              }
            )
          )}
        </div>
      </section>
    );
  }
  
  export default VisitorRecords;