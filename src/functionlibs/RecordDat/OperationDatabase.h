#pragma once
#include <QString>
#include <QStringList>
#include <QVariantMap>
#include <IDisksSetting.h>
#include <QDebug>
#include <QtSql>
#include <QMap>
//ʹ�ð�ȫ����
//1.���̴�С���ܳ�����256*256*256*128M
//2.
#define MAXFILENUM 256
typedef struct __tagSystemDatabaseInfo{
	QString sAllRecordDisk;//���е�¼���̷�
	volatile bool bIsRecover;//�Ƿ񸲸�¼��
	volatile quint64 uiDiskReservedSize;//���̱����ռ�
}tagSystemDatabaseInfo;
class OperationDatabase
{
public:
	OperationDatabase(void);
	~OperationDatabase(void);
public:
	void reloadSystemDatabase();
	QString getUsableDisk(QString &sDiskLisk);//����ֵ����ʣ��ռ���õ��̷�������������¼���̷��б�
	QString getLatestItem(QString sDisk);//d:
	QString getOldestItem(QString sDisk);//d:
	QString createLatestItem(QString sDisk);//���ڴ��̻��пռ䣬����ģʽ
	void clearInfoInDatabase(QString sFilePath);
	bool updateRecordDatabase(int nId,QVariantMap tInfo);//uiEndTime,uiType
	bool updateSearchDatabase(int nId,QVariantMap tInfo);//uiEndTime,uiType
	bool createSearchDatabaseItem(int nChannel,quint64 uiStartTime,quint64 uiEndTime,uint uiType,uint &uiItemId);
	bool createRecordDatabaseItem(int nChannel,quint64 uiStartTime,quint64 uiEndTime,uint uiType,QString sFileName,uint &uiItemId);
	void setRecordFileStatus(QString sFilePath,QVariantMap tInfo);
	bool getIsRecover();
private:
	bool createRecordDatabase(QString sDatabasePath);
	void priSetRecordFileStatus(QString sFilePath,QVariantMap tInfo);
	bool freeDisk();//ɾ��1.1.13�汾��¼�񣬰���ɾ��
private:
	IDisksSetting *m_pDisksSetting;
	tagSystemDatabaseInfo m_tSystemDatabaseInfo;
	QMap<QString,QMap<int ,QString>> m_tDeleteFileList;
};
