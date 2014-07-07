#pragma once
#include "IDisksSetting.h"
#include <QStringList>
#include <QMutex>
#include <QtSql>

class StorageMgr
{
	IDisksSetting* m_pDisksSetting;
// 	char m_currdisk;
// 	char m_usdisks[16];
public:
	StorageMgr(void);
	~StorageMgr(void);
	//disks setting
	int getFilePackageSize();
	QString getUseDisks();
	bool getLoopRecording();
	int getFreeSizeForDisk();
	bool freeDisk();
	int getInsertId();
	//

	QString getFileSavePath(QString devname,int nChannelNum,int winId, int type, QTime &start);

	bool GetDiskFreeSpaceEx(char* lpDirectoryName, quint64* lpFreeBytesAvailableToCaller, quint64* lpTotalNumberOfBytes, quint64* lpTotalNumberOfFreeBytes);

	//database operate
	void createTable();
// 	int addRecord(QString sDevName, int chl, int winId, QString sDate, QString sStart, int type, QString sPath);
	bool updateRecord(QString sEnd, int size);
	bool deleteRecord();
private:
	QStringList findEarlestRecord(QString dbPath, QDate &earlestDate);
	void deleteRecord(QString dbPath, QString date, QStringList filelist);
private:
	QString getUsableDisk();
	bool deleteOldDir(const QStringList& dirlist);
	/*bool deleteOldDirEx(const QStringList& dirlist);*/
// 	bool deleteDir(const QString& diskslist);
	QStringList deleteFile(const QStringList& fileList);
	QDate minDate(QList<QDate> dateList);
	static QMutex m_sLock;

	typedef struct _tagRecInfo{
		QString dbPath;
		QStringList fileLsit;
	}RecInfo;

	int m_insertId;
	QString m_curDisk;
	QString m_connectId;
	QSqlDatabase *m_db;
	static QMutex m_dblock;
	static QList<int > m_insertIdList;
};

